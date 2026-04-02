// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { CreateFileForm } from '@app/features/files/components';

const CreateFile: React.FunctionComponent = () => {
  const { t } = useTranslation(['files', 'common']);

  return (
    <PageBasic title={t('create')}>
      <CreateFileForm />
    </PageBasic>
  );
};

export default CreateFile;
