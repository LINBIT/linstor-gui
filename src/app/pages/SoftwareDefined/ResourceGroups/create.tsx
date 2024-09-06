// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceGroupFrom } from '@app/features/resourceGroup';

const ResourceGroupCreate = () => {
  return (
    <PageBasic title="Create Resource Group">
      <CreateResourceGroupFrom />
    </PageBasic>
  );
};

export default ResourceGroupCreate;
