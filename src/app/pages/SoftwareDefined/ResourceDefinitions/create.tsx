// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateForm as CreateResourceDefinitionForm } from '@app/features/resourceDefinition';

const Create = () => {
  return (
    <PageBasic title="Create Resource Definition">
      <CreateResourceDefinitionForm />
    </PageBasic>
  );
};

export default Create;
