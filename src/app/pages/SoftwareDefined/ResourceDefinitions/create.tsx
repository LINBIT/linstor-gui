// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateForm as CreateResourceDefinitionForm } from '@app/features/resourceDefinition';
import { useTranslation } from 'react-i18next';

const Create = () => {
  const { t } = useTranslation(['resource_definition']);
  return (
    <PageBasic title={t('resource_definition:create')}>
      <CreateResourceDefinitionForm />
    </PageBasic>
  );
};

export default Create;
