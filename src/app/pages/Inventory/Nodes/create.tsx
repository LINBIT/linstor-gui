// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { CreateNodeForm } from '@app/features/node';

const NodeCreate = () => {
  const { t } = useTranslation('node');

  return (
    <PageBasic title={t('create_node')}>
      <CreateNodeForm />
    </PageBasic>
  );
};

export default NodeCreate;
