// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import PageBasic from '@app/components/PageBasic';
import { StoragePoolEditForm } from '@app/features/storagePool';

const StoragePoolEdit = () => {
  const { t } = useTranslation();
  return (
    <PageBasic title={t('common:edit_storage_pool')}>
      <StoragePoolEditForm />
    </PageBasic>
  );
};

export default StoragePoolEdit;
