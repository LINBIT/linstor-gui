// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';

import { CreateNFSForm } from '@app/features/gateway';

const CreateNFS: React.FunctionComponent = () => {
  const { t } = useTranslation(['nfs', 'common']);

  return (
    <PageBasic title={t('nfs:create')}>
      <CreateNFSForm />
    </PageBasic>
  );
};

export default CreateNFS;
