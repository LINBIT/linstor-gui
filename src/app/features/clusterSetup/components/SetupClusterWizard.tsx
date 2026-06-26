// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button as AntButton,
  Form,
  Modal,
  Radio,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { Input } from '@app/components/Input';
import { InputNumber } from '@app/components/InputNumber';
import { Select } from '@app/components/Select';
import { DeviceSourceSelect, type DeviceSourceMode } from './DeviceSourceSelect';
import { CheckCircleTwoTone, CloseCircleTwoTone, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button';
import { createNode } from '@app/features/node/api';
import { createPhysicalStorage, createStoragePool } from '@app/features/storagePool';
import { createResourceGroup, updateResourceGroup } from '@app/features/resourceGroup';
import { ResourceGroupStep, type ResourceGroupStepHandle, type ResourceGroupPlan } from './ResourceGroupStep';
import { HASetupGuide } from './HASetupGuide';

type NodeType = 'Satellite' | 'Combined' | 'Auxiliary';

type NodeRow = {
  name: string;
  ip: string;
  port: number;
  type: NodeType;
};

type ProviderKind = 'LVM' | 'LVM_THIN' | 'ZFS' | 'ZFS_THIN' | 'FILE' | 'FILE_THIN';

type StoragePoolRow = {
  node: string;
  name: string;
  provider_kind: ProviderKind;
  source: string;
};

type NodeOutcome = { name: string; status: 'success' | 'error'; message?: string };

type SpOutcome = { node: string; pool: string; status: 'success' | 'error' | 'skipped'; message?: string };

type RgOutcome = { name: string; status: 'created' | 'error'; message?: string };

interface SetupClusterWizardProps {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

const PROVIDER_OPTIONS: { label: string; value: ProviderKind }[] = [
  { label: 'LVM', value: 'LVM' },
  { label: 'LVM Thin', value: 'LVM_THIN' },
  { label: 'ZFS', value: 'ZFS' },
  { label: 'ZFS Thin', value: 'ZFS_THIN' },
  { label: 'File', value: 'FILE' },
  { label: 'File Thin', value: 'FILE_THIN' },
];

const errMsg = (err: unknown): string => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) {
    return (
      err
        .map((e) => e?.message ?? '')
        .filter(Boolean)
        .join('; ') || 'Operation failed'
    );
  }
  return (err as Error)?.message ?? String(err);
};

export const SetupClusterWizard: React.FC<SetupClusterWizardProps> = ({ open, onClose, onCompleted }) => {
  const { t } = useTranslation(['clusterSetup', 'common']);
  const [nodeForm] = Form.useForm<{ nodes: NodeRow[] }>();
  // A single storage-pool config that is applied identically to every planned
  // node (same name / provider / device). Expanded to one row per node only
  // when collected.
  const [spForm] = Form.useForm<{ name: string; provider_kind: ProviderKind; source: string }>();

  const rgStepRef = useRef<ResourceGroupStepHandle>(null);

  const [step, setStep] = useState(0);
  const [poolMode, setPoolMode] = useState<DeviceSourceMode>('existing');

  // Plans collected as the user advances. Nothing is sent to the controller
  // until the final "Create cluster" step.
  const [nodePlan, setNodePlan] = useState<NodeRow[]>([]);
  const [poolPlan, setPoolPlan] = useState<StoragePoolRow[]>([]);
  const [rgPlan, setRgPlan] = useState<ResourceGroupPlan | null>(null);

  // Outcomes from the final create run.
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [nodeOutcomes, setNodeOutcomes] = useState<NodeOutcome[]>([]);
  const [poolOutcomes, setPoolOutcomes] = useState<SpOutcome[]>([]);
  const [rgOutcome, setRgOutcome] = useState<RgOutcome | null>(null);

  // Node names the user has entered so the pool step can target them before
  // the nodes actually exist on the controller.
  const plannedNodeNames = useMemo(
    () => nodePlan.map((n) => n.name?.trim()).filter((n): n is string => Boolean(n)),
    [nodePlan],
  );

  const reset = () => {
    setStep(0);
    setPoolMode('existing');
    setNodePlan([]);
    setPoolPlan([]);
    setRgPlan(null);
    setCreating(false);
    setCreated(false);
    setNodeOutcomes([]);
    setPoolOutcomes([]);
    setRgOutcome(null);
    nodeForm.resetFields();
    spForm.resetFields();
  };

  const handleClose = () => {
    onClose();
    // Defer reset so the modal close animation doesn't show empty fields.
    setTimeout(reset, 200);
  };

  // Step 0 → 1: just validate + remember the node rows.
  const collectNodes = async () => {
    let values: { nodes: NodeRow[] };
    try {
      values = await nodeForm.validateFields();
    } catch {
      return;
    }
    const rows = values.nodes ?? [];
    if (rows.length === 0) {
      message.warning(t('clusterSetup:add_at_least_one_node'));
      return;
    }
    setNodePlan(rows);
    setStep(1);
  };

  // Step 1 → 2: one pool config, fanned out to every planned node.
  const collectPools = async () => {
    let values: { name: string; provider_kind: ProviderKind; source: string };
    try {
      values = await spForm.validateFields();
    } catch {
      return;
    }
    setPoolPlan(
      plannedNodeNames.map((node) => ({
        node,
        name: values.name.trim(),
        provider_kind: values.provider_kind,
        source: values.source.trim(),
      })),
    );
    setStep(2);
  };

  const skipPools = () => {
    setPoolPlan([]);
    setStep(2);
  };

  // Step 2 → 3: remember the resource group config (or none when skipped).
  const collectRG = async () => {
    if (!rgStepRef.current) return;
    try {
      const plan = await rgStepRef.current.validateAndGet();
      setRgPlan(plan);
      setStep(3);
    } catch (err) {
      // rc-field-form rejects validation with { errorFields, ... }, not an
      // Error. Stay quiet on validation so the user can fix the inputs.
      const isValidationError = err !== null && typeof err === 'object' && 'errorFields' in (err as object);
      if (!isValidationError) {
        message.error(errMsg(err));
      }
    }
  };

  const skipRG = () => {
    setRgPlan(null);
    setStep(3);
  };

  // Final step: send every real request, in dependency order.
  const createCluster = async () => {
    setCreating(true);

    const nOutcomes: NodeOutcome[] = [];
    for (const row of nodePlan) {
      try {
        const res = await createNode({
          name: row.name.trim(),
          type: row.type,
          net_interfaces: [
            {
              name: 'default',
              address: row.ip.trim(),
              satellite_port: row.port,
              satellite_encryption_type: 'PLAIN',
              is_active: true,
            },
          ],
        });
        const data = (res as unknown as { data?: Array<{ ret_code?: number; message?: string }> }).data;
        const failed = Array.isArray(data) && data.some((entry) => (entry?.ret_code ?? 0) < 0);
        if (failed) {
          nOutcomes.push({
            name: row.name,
            status: 'error',
            message: data!.find((e) => (e?.ret_code ?? 0) < 0)?.message ?? 'Failed',
          });
        } else {
          nOutcomes.push({ name: row.name, status: 'success' });
        }
      } catch (err) {
        nOutcomes.push({ name: row.name, status: 'error', message: errMsg(err) });
      }
    }
    setNodeOutcomes(nOutcomes);
    const okNodes = new Set(nOutcomes.filter((o) => o.status === 'success').map((o) => o.name));

    const pOutcomes: SpOutcome[] = [];
    for (const row of poolPlan) {
      // Don't try to create a pool on a node that failed to register.
      if (!okNodes.has(row.node)) {
        pOutcomes.push({
          node: row.node,
          pool: row.name,
          status: 'skipped',
          message: t('clusterSetup:pool_skipped_node_failed'),
        });
        continue;
      }
      try {
        if (poolMode === 'new-device') {
          await createPhysicalStorage(row.node, {
            provider_kind: row.provider_kind,
            device_paths: [row.source.trim()],
            pool_name: row.name.trim(),
            with_storage_pool: { name: row.name.trim() },
          });
        } else {
          const body: Record<string, unknown> = {
            storage_pool_name: row.name.trim(),
            provider_kind: row.provider_kind,
            props: {},
          };
          if (row.provider_kind === 'LVM' || row.provider_kind === 'LVM_THIN') {
            body.props = { 'StorDriver/LvmVg': row.source.trim() };
          } else if (row.provider_kind === 'ZFS' || row.provider_kind === 'ZFS_THIN') {
            body.props = { 'StorDriver/ZPool': row.source.trim() };
          }
          await createStoragePool(row.node, body as never);
        }
        pOutcomes.push({ node: row.node, pool: row.name, status: 'success' });
      } catch (err) {
        pOutcomes.push({ node: row.node, pool: row.name, status: 'error', message: errMsg(err) });
      }
    }
    setPoolOutcomes(pOutcomes);

    if (rgPlan) {
      try {
        await createResourceGroup({ name: rgPlan.name, select_filter: rgPlan.select_filter } as never);
        // The resource-group create endpoint ignores `props` in its body, so
        // the DRBD options (preset or custom) must be applied via a follow-up
        // modify with `override_props`.
        if (Object.keys(rgPlan.props).length > 0) {
          await updateResourceGroup(rgPlan.name, { override_props: rgPlan.props } as never);
        }
        setRgOutcome({ name: rgPlan.name, status: 'created' });
      } catch (err) {
        setRgOutcome({ name: rgPlan.name, status: 'error', message: errMsg(err) });
      }
    }

    setCreating(false);
    setCreated(true);
    // Note: onCompleted() is deferred to the Close button so the user can read
    // the per-item outcomes (especially partial failures) before the Dashboard
    // refetches and dismisses the wizard.
  };

  // Close after a create run: let the Dashboard re-check the cluster (which
  // hides the setup card) only once the user dismisses the outcome summary.
  const handleFinish = () => {
    onCompleted();
    handleClose();
  };

  const nodeFooter = (
    <Space>
      <AntButton onClick={handleClose}>{t('common:cancel')}</AntButton>
      <Button type="primary" onClick={collectNodes}>
        {t('clusterSetup:next')}
      </Button>
    </Space>
  );

  const poolFooter = (
    <Space>
      <AntButton onClick={handleClose}>{t('common:cancel')}</AntButton>
      <AntButton onClick={() => setStep(0)}>{t('common:back')}</AntButton>
      <AntButton onClick={skipPools}>{t('common:skip')}</AntButton>
      <Button type="primary" onClick={collectPools}>
        {t('clusterSetup:next')}
      </Button>
    </Space>
  );

  const rgFooter = (
    <Space>
      <AntButton onClick={handleClose}>{t('common:cancel')}</AntButton>
      <AntButton onClick={() => setStep(1)}>{t('common:back')}</AntButton>
      <AntButton onClick={skipRG}>{t('common:skip')}</AntButton>
      <Button type="primary" onClick={collectRG}>
        {t('clusterSetup:next')}
      </Button>
    </Space>
  );

  const reviewFooter = created ? (
    <Space>
      <Button type="primary" onClick={handleFinish}>
        {t('common:close')}
      </Button>
    </Space>
  ) : (
    <Space>
      <AntButton disabled={creating} onClick={() => setStep(2)}>
        {t('common:back')}
      </AntButton>
      <Button type="primary" loading={creating} onClick={createCluster}>
        {t('clusterSetup:create_cluster')}
      </Button>
    </Space>
  );

  return (
    <Modal
      title={t('clusterSetup:title')}
      open={open}
      width={920}
      onCancel={handleClose}
      maskClosable={false}
      footer={step === 0 ? nodeFooter : step === 1 ? poolFooter : step === 2 ? rgFooter : reviewFooter}
      destroyOnHidden
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: t('clusterSetup:step_nodes') },
          { title: t('clusterSetup:step_pools') },
          { title: t('clusterSetup:step_resource_group') },
          { title: t('clusterSetup:step_review') },
        ]}
      />

      {step === 0 && (
        <Form form={nodeForm} initialValues={{ nodes: [{ name: '', ip: '', port: 3366, type: 'Satellite' }] }}>
          <Form.List name="nodes">
            {(fields, { add, remove }) => (
              <>
                <Table
                  rowKey={(_, idx) => String(idx)}
                  pagination={false}
                  size="small"
                  dataSource={fields}
                  columns={[
                    {
                      title: t('clusterSetup:node_name'),
                      key: 'name',
                      render: (_, _row, idx) => (
                        <Form.Item
                          name={[idx, 'name']}
                          rules={[{ required: true, message: t('clusterSetup:required') }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="node01" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: t('clusterSetup:node_ip'),
                      key: 'ip',
                      render: (_, _row, idx) => (
                        <Form.Item
                          name={[idx, 'ip']}
                          rules={[{ required: true, message: t('clusterSetup:required') }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="10.0.0.1" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: t('clusterSetup:node_port'),
                      key: 'port',
                      width: 110,
                      render: (_, _row, idx) => (
                        <Form.Item
                          name={[idx, 'port']}
                          rules={[{ required: true, message: t('clusterSetup:required') }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '',
                      key: 'action',
                      width: 40,
                      render: (_, _row, idx) => (
                        <AntButton
                          type="text"
                          icon={<MinusCircleOutlined />}
                          disabled={fields.length <= 1}
                          onClick={() => remove(idx)}
                        />
                      ),
                    },
                  ]}
                />
                <AntButton
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 12 }}
                  onClick={() => add({ name: '', ip: '', port: 3366, type: 'Satellite' })}
                >
                  {t('clusterSetup:add_node_row')}
                </AntButton>
              </>
            )}
          </Form.List>
        </Form>
      )}

      {step === 1 && (
        <Form
          form={spForm}
          layout="vertical"
          initialValues={{ name: 'lvm-thin-pool', provider_kind: 'LVM_THIN' as ProviderKind, source: '' }}
        >
          <Radio.Group
            value={poolMode}
            onChange={(e) => setPoolMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            style={{ marginBottom: 12 }}
            options={[
              { label: t('clusterSetup:mode_existing'), value: 'existing' },
              { label: t('clusterSetup:mode_new_device'), value: 'new-device' },
            ]}
          />
          <Alert type="info" showIcon message={t('clusterSetup:pools_hint')} style={{ marginBottom: 16 }} />

          {/* One pool config; the same name / provider / device is applied to every node. */}
          <Space size="large" align="start" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Form.Item
              name="name"
              label={t('clusterSetup:pool_name')}
              rules={[{ required: true, message: t('clusterSetup:required') }]}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="lvm-thin-pool" style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="provider_kind" label={t('clusterSetup:provider')} style={{ marginBottom: 8 }}>
              <Select options={PROVIDER_OPTIONS} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item
              name="source"
              label={t('clusterSetup:source')}
              rules={[{ required: true, message: t('clusterSetup:required') }]}
              style={{ marginBottom: 8, minWidth: 280, flex: 1 }}
            >
              <DeviceSourceSelect mode={poolMode} node={plannedNodeNames[0]} />
            </Form.Item>
          </Space>

          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            {t('clusterSetup:pool_applies_to_all', { nodes: plannedNodeNames.join(', ') })}
          </Typography.Text>
        </Form>
      )}

      {step === 2 && <ResourceGroupStep ref={rgStepRef} nodeCount={plannedNodeNames.length} />}

      {step === 3 && !created && (
        <Spin spinning={creating} tip={t('clusterSetup:creating_cluster')}>
          <div style={{ padding: '8px 0' }}>
            <Typography.Text strong>{t('clusterSetup:step_nodes')}</Typography.Text>
            <div style={{ margin: '6px 0 12px' }}>
              {nodePlan.map((n) => (
                <Tag key={n.name} color="blue" style={{ marginBottom: 4 }}>
                  {n.name} ({n.ip}:{n.port})
                </Tag>
              ))}
            </div>

            <Typography.Text strong>{t('clusterSetup:step_pools')}</Typography.Text>
            <div style={{ margin: '6px 0 12px' }}>
              {poolPlan.length === 0 ? (
                <Typography.Text type="secondary">{t('clusterSetup:rg_skipped_none')}</Typography.Text>
              ) : (
                <Tag color="blue" style={{ marginBottom: 4 }}>
                  {poolPlan[0].name} ({poolPlan[0].provider_kind}: {poolPlan[0].source}) —{' '}
                  {poolPlan.map((p) => p.node).join(', ')}
                </Tag>
              )}
            </div>

            <Typography.Text strong>{t('clusterSetup:step_resource_group')}</Typography.Text>
            <div style={{ marginTop: 6 }}>
              {rgPlan ? (
                <>
                  <Tag color="blue">{rgPlan.name}</Tag>
                  {Object.keys(rgPlan.props).length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {Object.entries(rgPlan.props).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 2 }}>
                          <Typography.Text code>{k}</Typography.Text>
                          {' = '}
                          <Typography.Text code>{v}</Typography.Text>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Typography.Text type="secondary">{t('clusterSetup:rg_skipped_none')}</Typography.Text>
              )}
            </div>
          </div>
        </Spin>
      )}

      {step === 3 && created && (
        <div style={{ padding: '8px 0' }}>
          <Typography.Title level={4}>{t('clusterSetup:all_done')}</Typography.Title>
          <Typography.Paragraph type="secondary">{t('clusterSetup:done_description')}</Typography.Paragraph>
          {nodeOutcomes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text strong>{t('clusterSetup:step_nodes')}</Typography.Text>
              <div style={{ marginTop: 6 }}>
                {nodeOutcomes.map((o) => (
                  <Tag
                    key={o.name}
                    icon={
                      o.status === 'success' ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />
                      ) : (
                        <CloseCircleTwoTone twoToneColor="#ff4d4f" />
                      )
                    }
                    color={o.status === 'success' ? 'green' : 'red'}
                    style={{ marginBottom: 4 }}
                  >
                    {o.name}
                    {o.message ? `: ${o.message}` : ''}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {poolOutcomes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text strong>{t('clusterSetup:step_pools')}</Typography.Text>
              <div style={{ marginTop: 6 }}>
                {poolOutcomes.map((o) => (
                  <Tag
                    key={`${o.node}:${o.pool}`}
                    color={o.status === 'success' ? 'green' : o.status === 'skipped' ? 'default' : 'red'}
                    style={{ marginBottom: 4 }}
                  >
                    {o.node} / {o.pool}
                    {o.message ? `: ${o.message}` : ''}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {rgOutcome && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text strong>{t('clusterSetup:step_resource_group')}</Typography.Text>
              <div style={{ marginTop: 6 }}>
                {rgOutcome.status === 'created' && <Tag color="green">{rgOutcome.name}</Tag>}
                {rgOutcome.status === 'error' && (
                  <Tag color="red">
                    {rgOutcome.name}
                    {rgOutcome.message ? `: ${rgOutcome.message}` : ''}
                  </Tag>
                )}
              </div>
            </div>
          )}

          <HASetupGuide />
        </div>
      )}
    </Modal>
  );
};
