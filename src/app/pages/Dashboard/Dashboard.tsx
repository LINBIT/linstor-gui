// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { StoragePoolInfo } from './components/StoragePoolInfo';
import { FaultyList } from '@app/features/resource';

const Dashboard: React.FunctionComponent = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  return (
    <PageBasic title={t('dashboard:title')}>
      <StoragePoolInfo />
      <FaultyList />
    </PageBasic>
  );
};

export default Dashboard;
