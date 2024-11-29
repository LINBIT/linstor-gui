// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { StoragePoolCreateForm } from '@app/features/storagePool';
import { useTranslation } from 'react-i18next';

const StoragePoolCreate = () => {
  const { t } = useTranslation('storage_pool');
  return (
    <PageBasic title={t('add_title')}>
      <p>{t('add_description')}</p>
      <StoragePoolCreateForm />
    </PageBasic>
  );
};

export default StoragePoolCreate;
