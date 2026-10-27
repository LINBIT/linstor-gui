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
      className="border-2 border-(--brand-accent)"
      style={{
        // Subtle brand tint fading to the page background — theme-aware
        // (the old hardcoded #fff8f1→#fff washed the text out in dark mode).
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--bg-chip-brand) 35%, var(--bg-page)) 0%, var(--bg-page) 100%)',
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Space size="large" align="start" className="w-full" wrap>
        <div className="flex size-14 flex-none items-center justify-center rounded-xl bg-(--bg-chip-brand) text-[28px] text-(--brand-accent)">
          <RocketOutlined />
        </div>

        <div className="flex-1 min-w-[280px]">
          <Typography.Title level={4} className="mt-0 mb-2">
            {t('clusterSetup:welcome_title')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="mb-3">
            {t('clusterSetup:welcome_description')}
          </Typography.Paragraph>
          <Space size={[24, 8]} wrap>
            <Space size={6}>
              <CloudServerOutlined className="text-(--brand-accent)" />
              <Typography.Text>{t('clusterSetup:welcome_bullet_nodes')}</Typography.Text>
            </Space>
            <Space size={6}>
              <DatabaseOutlined className="text-(--brand-accent)" />
              <Typography.Text>{t('clusterSetup:welcome_bullet_pools')}</Typography.Text>
            </Space>
          </Space>
        </div>
      </Space>

      <div className="flex justify-end gap-2 mt-6">
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
