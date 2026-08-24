// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo, useState } from 'react';
import { Alert, Collapse, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';

import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';

import {
  DEFAULT_HA_NODE_COUNT,
  HA_NODE_PICKER_THRESHOLD,
  MIN_HA_NODES,
  buildHaSetupCommand,
  isValidHaVip,
} from '../haSetupCommand';

// Reference: LINSTOR user guide §3.1 "Creating a highly available LINSTOR
// cluster". The work itself is done by linstor-controller-ha-setup, which
// ships with linstor-controller — the wizard only assembles the command line
// for it, so the operator can paste it into a shell on the controller node.

const codeStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  padding: '12px 14px',
  borderRadius: 6,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  lineHeight: 1.5,
  overflow: 'auto',
  margin: '8px 0 0',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};

interface HASetupGuideProps {
  /** Storage pool the wizard just created — used for the controller-DB resource. */
  storagePool?: string;
  /** All node names of the new cluster. */
  nodes?: string[];
}

const HAGuideBody: React.FC<HASetupGuideProps> = ({ storagePool, nodes }) => {
  const { t } = useTranslation(['clusterSetup']);

  const allNodes = useMemo(() => (nodes ?? []).filter(Boolean), [nodes]);
  // Small clusters have nothing to choose: every node becomes a candidate.
  // Beyond that, running a controller on every node is rarely what you want,
  // so the operator picks — preselected with the first few.
  const needsPicker = allNodes.length > HA_NODE_PICKER_THRESHOLD;
  const [picked, setPicked] = useState<string[]>(() => allNodes.slice(0, DEFAULT_HA_NODE_COUNT));

  // Keep the candidates in cluster order regardless of the click order.
  const candidates = useMemo(
    () => (needsPicker ? allNodes.filter((node) => picked.includes(node)) : allNodes),
    [needsPicker, allNodes, picked],
  );

  // Optional: one address that follows the active controller, instead of
  // pointing every client at the list of candidates.
  const [vip, setVip] = useState('');
  const vipInvalid = vip.trim().length > 0 && !isValidHaVip(vip.trim());

  // Keep showing the command for whatever is selected — but refuse to hand it
  // over, so nobody pastes something the script would only reject.
  const tooFewNodes = needsPicker && candidates.length < MIN_HA_NODES;
  const command = buildHaSetupCommand({
    storagePool,
    nodes: candidates,
    vip: vipInvalid ? undefined : vip,
  });

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      message.success(t('clusterSetup:ha_cmd_copied'));
    } catch {
      message.error(t('clusterSetup:ha_cmd_copy_failed'));
    }
  };

  return (
    <div>
      <Typography.Paragraph>{t('clusterSetup:ha_cmd_intro')}</Typography.Paragraph>
      <ul style={{ paddingLeft: 20, marginBottom: 12, listStyleType: 'disc' }}>
        <li>
          <Typography.Text>{t('clusterSetup:ha_cmd_req_root')}</Typography.Text>
        </li>
        <li>
          <Typography.Text>{t('clusterSetup:ha_cmd_req_packages')}</Typography.Text>
        </li>
        <li>
          <Typography.Text>{t('clusterSetup:ha_cmd_req_standby')}</Typography.Text>
        </li>
      </ul>

      {needsPicker && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text strong>{t('clusterSetup:ha_cmd_nodes_label')}</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            value={picked}
            onChange={setPicked}
            options={allNodes.map((node) => ({ label: node, value: node }))}
            style={{ width: '100%', marginTop: 6 }}
            placeholder={t('clusterSetup:ha_cmd_nodes_label')}
            aria-label={t('clusterSetup:ha_cmd_nodes_label')}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('clusterSetup:ha_cmd_nodes_hint')}
          </Typography.Text>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <Typography.Text strong>{t('clusterSetup:ha_cmd_vip_label')}</Typography.Text>
        <Input
          value={vip}
          onChange={(e) => setVip(e.target.value)}
          placeholder="10.0.0.100/24"
          status={vipInvalid ? 'error' : undefined}
          style={{ marginTop: 6 }}
          aria-label={t('clusterSetup:ha_cmd_vip_label')}
        />
        <Typography.Text type={vipInvalid ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
          {vipInvalid ? t('clusterSetup:ha_cmd_vip_invalid') : t('clusterSetup:ha_cmd_vip_hint')}
        </Typography.Text>
      </div>

      {tooFewNodes && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('clusterSetup:ha_cmd_nodes_min', { count: MIN_HA_NODES })}
        />
      )}

      <Button type="primary" icon={<CopyOutlined />} onClick={copyCommand} disabled={tooFewNodes || vipInvalid}>
        {t('clusterSetup:ha_cmd_copy')}
      </Button>

      <pre style={codeStyle}>{command}</pre>

      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        {t('clusterSetup:ha_cmd_outro')}
      </Typography.Paragraph>
    </div>
  );
};

export const HASetupGuide: React.FC<HASetupGuideProps> = ({ storagePool, nodes }) => {
  const { t } = useTranslation(['clusterSetup']);

  return (
    <div style={{ marginTop: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 6 }}>
        {t('clusterSetup:further_tasks')}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        {t('clusterSetup:further_tasks_intro')}
      </Typography.Paragraph>

      <Collapse
        items={[
          {
            key: 'ha',
            label: t('clusterSetup:ha_guide_label'),
            children: <HAGuideBody storagePool={storagePool} nodes={nodes} />,
          },
        ]}
      />
    </div>
  );
};
