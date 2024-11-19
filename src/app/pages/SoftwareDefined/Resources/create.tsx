// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceForm } from '@app/features/resource';

const ResourceCreate = () => {
  const { t } = useTranslation('resource');
  return (
    <PageBasic title={t('create')}>
      <CreateResourceForm />
    </PageBasic>
  );
};

export default ResourceCreate;
