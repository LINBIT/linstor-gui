// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { CreateNodeForm } from '@app/features/node';

const NodeEdit: React.FC = () => {
  const { t } = useTranslation(['node']);
  return (
    <PageBasic title={t('node:edit_node')}>
      <CreateNodeForm editing />
    </PageBasic>
  );
};

export default NodeEdit;
