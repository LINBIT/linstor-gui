// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import PageBasic from '@app/components/PageBasic';

import { List } from '@app/features/storagePool';

const StoragePoolList: React.FC = () => {
  const { t } = useTranslation(['storage_pool', 'common']);
  return (
    <PageBasic title={t('list')}>
      <List />
    </PageBasic>
  );
};

export default StoragePoolList;
