// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo } from 'react';
import { Collapse, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import Button from '@app/components/Button';

import { buildHaSetupScript } from '../haSetupScript';

// Reference: LINSTOR user guide §3.1 "Creating a highly available LINSTOR
// cluster". Instead of a long manual CLI walkthrough, the wizard now emits a
// ready-to-run Python script parameterized with the pool/nodes it just
// created. The script itself is intentionally English; labels go through i18n.

const codeStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  padding: '12px 14px',
  borderRadius: 6,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  lineHeight: 1.5,
  overflow: 'auto',
  maxHeight: 420,
  margin: '8px 0 0',
  whiteSpace: 'pre',
};

interface HASetupGuideProps {
  /** Storage pool the wizard just created — used for the controller-DB resource. */
  storagePool?: string;
  /** All node names of the new cluster. */
  nodeNames?: string[];
}

const SCRIPT_FILENAME = 'linstor-controller-ha-setup.py';

const HAGuideBody: React.FC<HASetupGuideProps> = ({ storagePool, nodeNames }) => {
  const { t } = useTranslation(['clusterSetup']);
  const script = useMemo(() => buildHaSetupScript({ storagePool, nodeNames }), [storagePool, nodeNames]);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      message.success(t('clusterSetup:ha_script_copied'));
    } catch {
      message.error(t('clusterSetup:ha_script_copy_failed'));
    }
  };

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = SCRIPT_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Typography.Paragraph>{t('clusterSetup:ha_script_intro')}</Typography.Paragraph>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li>
          <Typography.Text>{t('clusterSetup:ha_script_req_root')}</Typography.Text>
        </li>
        <li>
          <Typography.Text>{t('clusterSetup:ha_script_req_packages')}</Typography.Text>
        </li>
        <li>
          <Typography.Text>{t('clusterSetup:ha_script_req_standby')}</Typography.Text>
        </li>
      </ul>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<CopyOutlined />} onClick={copyScript}>
          {t('clusterSetup:ha_script_copy')}
        </Button>
        <Button type="secondary" icon={<DownloadOutlined />} onClick={downloadScript}>
          {t('clusterSetup:ha_script_download')}
        </Button>
      </div>

      <pre style={codeStyle}>{script}</pre>

      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        {t('clusterSetup:ha_script_outro')}
      </Typography.Paragraph>
    </div>
  );
};

export const HASetupGuide: React.FC<HASetupGuideProps> = ({ storagePool, nodeNames }) => {
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
            children: <HAGuideBody storagePool={storagePool} nodeNames={nodeNames} />,
          },
        ]}
      />
    </div>
  );
};
