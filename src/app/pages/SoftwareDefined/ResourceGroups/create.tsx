// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceGroupFrom } from '@app/features/resourceGroup';
import { useTranslation } from 'react-i18next';

const ResourceGroupCreate = () => {
  const { t } = useTranslation('resource_group');
  return (
    <PageBasic title={t('create')}>
      <CreateResourceGroupFrom />
    </PageBasic>
  );
};

export default ResourceGroupCreate;
