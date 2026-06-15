// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Card, Space, Typography } from 'antd';
import { CloudServerOutlined, DatabaseOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button';

export interface SetupClusterCardProps {
  onStart: () => void;
  onDismiss: () => void;
}

export const SetupClusterCard: React.FC<SetupClusterCardProps> = ({ onStart, onDismiss }) => {
  const { t } = useTranslation(['clusterSetup', 'common']);

  return (
    <Card
      style={{
        borderColor: '#F79133',
        borderWidth: 2,
        background: 'linear-gradient(135deg, #fff8f1 0%, #ffffff 100%)',
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Space size="large" align="start" style={{ width: '100%' }} wrap>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'rgba(247, 145, 51, 0.12)',
            color: '#F79133',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flex: '0 0 auto',
          }}
        >
          <RocketOutlined />
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>
            {t('clusterSetup:welcome_title')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            {t('clusterSetup:welcome_description')}
          </Typography.Paragraph>
          <Space size={[24, 8]} wrap>
            <Space size={6}>
              <CloudServerOutlined style={{ color: '#F79133' }} />
              <Typography.Text>{t('clusterSetup:welcome_bullet_nodes')}</Typography.Text>
            </Space>
            <Space size={6}>
              <DatabaseOutlined style={{ color: '#F79133' }} />
              <Typography.Text>{t('clusterSetup:welcome_bullet_pools')}</Typography.Text>
            </Space>
          </Space>
        </div>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <Button type="default" size="large" onClick={onDismiss}>
          {t('clusterSetup:dismiss')}
        </Button>
        <Button type="primary" size="large" onClick={onStart}>
          {t('clusterSetup:get_started')}
        </Button>
      </div>
    </Card>
  );
};
