// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { Button } from '@app/components/Button';
import { List } from '@app/features/ha';
import { useLinstorVersion, MIN_API_VERSION } from '@app/hooks';

const HA = () => {
  const { t } = useTranslation(['ha', 'common']);
  const navigate = useNavigate();
  const { isFetched: versionFetched, hasMinVersion } = useLinstorVersion();

  if (versionFetched && !hasMinVersion(MIN_API_VERSION.HA)) {
    return (
      <PageBasic title={t('ha:list')}>
        <Alert
          type="warning"
          showIcon
          message={t('common:feature_unavailable')}
          description={t('common:feature_requires_api_version', { version: MIN_API_VERSION.HA })}
        />
      </PageBasic>
    );
  }

  return (
    <PageBasic
      title={t('ha:list')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reactor/create')}>
          {t('common:add')}
        </Button>
      }
    >
      <List />
    </PageBasic>
  );
};

export default HA;
