// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { CreateResourceForm } from '@app/features/resource';

const ResourceCreate = () => {
  return (
    <PageBasic title="Create Resource">
      <CreateResourceForm />
    </PageBasic>
  );
};

export default ResourceCreate;
