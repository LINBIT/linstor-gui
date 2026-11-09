// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Collapse, Form, message, Tooltip } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { useNavigate } from 'react-router-dom';

import {
  getPhysicalStoragePoolByNode,
  ProviderKind,
  CreatePhysicalStorageRequestBody,
  createPhysicalStorage,
  createStoragePool,
  CreateStoragePoolRequestBody,
} from '@app/features/storagePool';
import { useNodes } from '@app/features/node';
import { SizeInput } from '@app/components/SizeInput';
import { Switch } from '@app/components/Switch';
import { InlineFormItem } from '@app/components/InlineFormItem';

import { useTranslation } from 'react-i18next';
import { Radio } from '@app/components/Radio';
import { unwrap } from '@app/features/requests';

type FormType = {
  create_type: 'new' | 'existing';
  storage_pool_name: string;
  pool_name?: string;
  node: string | string[];
  provider_kind: ProviderKind;
  device_paths?: string[];
  storage_driver_name: string;
  multiple_nodes: boolean;
  sed?: boolean;
  vdo_enable?: boolean;
  vdo_slab_size_kib?: number;
  vdo_logical_size_kib?: number;
};

const CreateForm = () => {
  const nodes = useNodes();
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'storage_pool']);

  const queryClient = useQueryClient();

  const [form] = Form.useForm<FormType>();
  const provider_kind = Form.useWatch('provider_kind', form);
  const node = Form.useWatch('node', form);
  const create_type = Form.useWatch('create_type', form);
  const multiple_nodes = Form.useWatch('multiple_nodes', form);
  const vdo_enable = Form.useWatch('vdo_enable', form);

  const backToStoragePoolList = () => {
    queryClient.invalidateQueries({
      queryKey: ['getStoragePool'],
    });
    navigate(-1);
  };

  const selectedNodes = !node ? [] : Array.isArray(node) ? node : [node];

  // The same device paths are sent to every selected node, so only the
  // devices all of them have are offered.
  const { data: devicePaths } = useQuery({
    queryKey: ['getPhysicalStoragePoolByNode', selectedNodes],
    queryFn: async () => {
      const replies = await Promise.all(selectedNodes.map((e) => getPhysicalStoragePoolByNode({ node: e })));
      const perNode = replies.map((reply) => (reply.data ?? []).flatMap((e) => (e.device ? [e.device] : [])));
      return perNode[0].filter((device) => perNode.every((paths) => paths.includes(device)));
    },
    enabled: selectedNodes.length > 0 && create_type === 'new',
  });

  // Both mutations unwrap: a pool the controller refuses rejects, so the
  // form stays instead of going back to the list as if it had been created.
  const createStoragePoolWithPhysicalStorage = useMutation({
    mutationFn: (data: CreatePhysicalStorageRequestBody & { node: string }) => {
      const { node, ...rest } = data;
      return unwrap(createPhysicalStorage(node, rest));
    },
  });

  const createStoragePoolWithExistingVolumeGroup = useMutation({
    mutationFn: (
      data: CreateStoragePoolRequestBody & {
        node: string;
      },
    ) => {
      const { node, ...rest } = data;

      return unwrap(createStoragePool(node, rest));
    },
  });

  const typeListForNewDevice = [
    { label: 'LVM', value: 'LVM' },
    { label: 'LVM_THIN', value: 'LVM_THIN' },
    { label: 'ZFS', value: 'ZFS' },
    { label: 'ZFS_THIN', value: 'ZFS_THIN' },
  ];

  const typeListForExisting = [
    { label: 'DISKLESS', value: 'DISKLESS' },
    { label: 'LVM', value: 'LVM' },
    { label: 'LVM_THIN', value: 'LVM_THIN' },
    { label: 'ZFS', value: 'ZFS' },
    { label: 'ZFS_THIN', value: 'ZFS_THIN' },
    { label: 'FILE', value: 'FILE' },
    { label: 'FILE_THIN', value: 'FILE_THIN' },
    { label: 'SPDK', value: 'SPDK' },
    { label: 'REMOTE_SPDK', value: 'REMOTE_SPDK' },
    { label: 'EBS_TARGET', value: 'EBS_TARGET' },
    { label: 'EBS_INIT', value: 'EBS_INIT' },
    { label: 'STORAGE_SPACES', value: 'STORAGE_SPACES' },
    { label: 'STORAGE_SPACES_THIN', value: 'STORAGE_SPACES_THIN' },
  ];

  const onFinish = (values: FormType) => {
    // use create_type to determine the request body
    // for new: we use /v1/physical-storage/{node} to create the physical storage and storage pool
    if (create_type === 'new') {
      const {
        storage_pool_name,
        pool_name,
        provider_kind,
        device_paths,
        sed,
        vdo_enable,
        vdo_slab_size_kib,
        vdo_logical_size_kib,
      } = values;

      const body: CreatePhysicalStorageRequestBody = {
        pool_name: pool_name ? pool_name : storage_pool_name,
        provider_kind,
        raid_level: 'JBOD',
        device_paths: device_paths ?? [],
        with_storage_pool: {
          name: storage_pool_name,
          external_locking: false,
        },
        sed: sed ?? false,
        vdo_enable: vdo_enable ?? false,
        vdo_slab_size_kib: vdo_slab_size_kib ?? 0,
        vdo_logical_size_kib: vdo_logical_size_kib ?? 0,
      };

      // mutate() returns void, so Promise.all over it resolved at once and the
      // page left before the controller had answered; wait for the requests.
      const targets = Array.isArray(node) ? node : [node];
      Promise.all(targets.map((e) => createStoragePoolWithPhysicalStorage.mutateAsync({ node: e, ...body })))
        .then(() => backToStoragePoolList())
        .catch(() => undefined);
    }

    if (create_type === 'existing') {
      const { storage_pool_name, provider_kind, storage_driver_name, node: selectedNode } = values;

      // A diskless pool has no volume group or pool behind it; the
      // controller refuses an empty StorDriver/StorPoolName.
      const body = {
        storage_pool_name: storage_pool_name,
        provider_kind,
        ...(provider_kind !== 'DISKLESS' && {
          props: {
            'StorDriver/StorPoolName': storage_driver_name,
          },
        }),
        external_locking: false,
      };

      // One request per node, and one step back once all are done: going
      // back on each success went back once per node, out of the GUI.
      const targets = Array.isArray(selectedNode) ? selectedNode : [selectedNode];
      Promise.all(targets.map((e) => createStoragePoolWithExistingVolumeGroup.mutateAsync({ node: e, ...body })))
        .then(() => backToStoragePoolList())
        .catch(() => undefined);
    }
  };

  const isZSFType = provider_kind === 'ZFS' || provider_kind === 'ZFS_THIN';

  return (
    <Form
      className="max-w-[600px]"
      size="large"
      layout="vertical"
      form={form}
      initialValues={{
        provider_kind: 'LVM',
        create_type: 'new',
      }}
      onFinish={onFinish}
    >
      <Form.Item name="create_type">
        <Radio.Group
          onChange={() => {
            form.setFieldsValue({
              storage_pool_name: '',
              pool_name: '',
              device_paths: undefined,
              storage_driver_name: '',
              sed: false,
              vdo_enable: false,
              vdo_slab_size_kib: undefined,
              vdo_logical_size_kib: undefined,
              provider_kind: 'LVM',
            });
          }}
          optionType="button"
          options={[
            {
              value: 'new',
              label: <Tooltip title={t('storage_pool:new_device_description')}>{t('storage_pool:new_device')}</Tooltip>,
            },
            {
              value: 'existing',
              label: (
                <Tooltip title={t('storage_pool:existing_device_description')}>
                  {t('storage_pool:existing_device')}
                </Tooltip>
              ),
            },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="storage_pool_name"
        label={t('storage_pool:storage_pool_name')}
        required
        rules={[
          { required: true, message: t('storage_pool:name_required') },
          {
            pattern: new RegExp('^(?!-)[a-zA-Z_][a-zA-Z0-9_-]{1,47}[-a-zA-Z0-9_]$'),
            message: t('storage_pool:name_invalid'),
          },
        ]}
      >
        <Input placeholder={t('storage_pool:enter_storage_pool_name')} />
      </Form.Item>

      {create_type === 'new' && (
        <InlineFormItem
          name="multiple_nodes"
          label={t('storage_pool:multiple_nodes')}
          tooltip={t('storage_pool:multiple_nodes_tooltip')}
        >
          <Switch />
        </InlineFormItem>
      )}

      <Form.Item
        label={t('storage_pool:node')}
        name="node"
        required
        rules={[{ required: true, message: t('common:nodes_required') }]}
        tooltip={t('storage_pool:nodes_tooltip')}
      >
        <Select
          allowClear
          showSearch
          placeholder={t('storage_pool:select_node_nodes')}
          options={nodes?.data?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
          mode={create_type !== 'new' || multiple_nodes ? 'multiple' : undefined}
          // Devices chosen for other nodes may not exist on these.
          onChange={() => form.setFieldValue('device_paths', undefined)}
        />
      </Form.Item>

      <Form.Item label={t('storage_pool:type')} name="provider_kind" required tooltip={t('storage_pool:type_tooltip')}>
        <Select
          allowClear
          showSearch
          options={(create_type === 'new' ? typeListForNewDevice : typeListForExisting).map((e) => ({
            label: e.label,
            value: e.value,
          }))}
          onChange={(value) => {
            if (value === 'ZFS' || value === 'ZFS_THIN') {
              message.info(t('storage_pool:zfs_toast'));
            }
          }}
        />
      </Form.Item>

      {create_type === 'new' && (
        <>
          <Form.Item
            label={t('storage_pool:device_path')}
            name="device_paths"
            required
            rules={[{ required: true, message: t('storage_pool:device_path_required') }]}
            tooltip={t('storage_pool:device_path_tooltip')}
          >
            <Select
              allowClear
              mode="multiple"
              placeholder={t('storage_pool:select_path_physical_device')}
              options={devicePaths?.map((e) => ({
                label: e,
                value: e,
              }))}
            />
          </Form.Item>

          <Collapse
            ghost
            items={[
              {
                key: '1',
                label: t('storage_pool:advanced_options'),
                children: (
                  <>
                    <Form.Item
                      label={isZSFType ? t('storage_pool:zfs_pool_name') : t('storage_pool:lvm_pool_name')}
                      name="pool_name"
                      tooltip={isZSFType ? 'ZSF Pool Name' : 'VG or VG/Thinpool Name'}
                    >
                      <Input placeholder={t('storage_pool:enter_pool_name')} />
                    </Form.Item>
                    <InlineFormItem
                      label={t('storage_pool:sed')}
                      name="sed"
                      valuePropName="checked"
                      tooltip={t('storage_pool:sed_tooltip')}
                    >
                      <Switch />
                    </InlineFormItem>
                    {
                      // VDO is only available for LVM and LVM_THIN
                      provider_kind === 'LVM' || provider_kind === 'LVM_THIN' ? (
                        <InlineFormItem label={t('storage_pool:vdo')} name="vdo_enable" valuePropName="checked">
                          <Switch />
                        </InlineFormItem>
                      ) : null
                    }
                    {vdo_enable && (
                      <>
                        <Form.Item
                          label={t('storage_pool:vdo_slab_size')}
                          name="vdo_slab_size_kib"
                          tooltip={t('storage_pool:vdo_slab_tooltip')}
                        >
                          <SizeInput />
                        </Form.Item>
                        <Form.Item
                          label={t('storage_pool:vdo_logical_size')}
                          name="vdo_logical_size_kib"
                          tooltip={t('storage_pool:vdo_logical_tooltip')}
                        >
                          <SizeInput />
                        </Form.Item>
                      </>
                    )}
                  </>
                ),
              },
            ]}
          />
        </>
      )}

      {create_type === 'existing' && provider_kind !== 'DISKLESS' && (
        <Form.Item
          name="storage_driver_name"
          label={isZSFType ? t('storage_pool:zfs_pool') : t('storage_pool:lvm_pool')}
          required
        >
          <Input placeholder={`${isZSFType ? 'ZFS Pool name' : 'Volume Group/Thin Pool Name'}`} />
        </Form.Item>
      )}

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          disabled={
            createStoragePoolWithExistingVolumeGroup.isPending || createStoragePoolWithPhysicalStorage.isPending
          }
          loading={createStoragePoolWithExistingVolumeGroup.isPending || createStoragePoolWithPhysicalStorage.isPending}
        >
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={backToStoragePoolList} className="ml-[1em]">
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateForm };
