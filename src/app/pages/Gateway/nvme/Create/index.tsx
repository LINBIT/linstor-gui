// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import PageBasic from '@app/components/PageBasic';

import { CreateNVMEOfForm } from '@app/features/gateway';

const Create: React.FunctionComponent = () => {
  const { t } = useTranslation(['nvme', 'common']);

  return (
    <PageBasic title={t('nvme:create')}>
      <CreateNVMEOfForm />
    </PageBasic>
  );
};

export default Create;
