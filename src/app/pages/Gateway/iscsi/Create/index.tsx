// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { CreateISCSIForm } from '@app/features/gateway';

const CreateISCSI: React.FunctionComponent = () => {
  const { t } = useTranslation(['iscsi', 'common']);

  return (
    <PageBasic title={t('iscsi:create')}>
      <CreateISCSIForm />
    </PageBasic>
  );
};

export default CreateISCSI;
