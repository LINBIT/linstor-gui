// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { StoragePoolCreateForm } from '@app/features/storagePool';

const StoragePoolCreate = () => {
  return (
    <PageBasic title="Add Storage Pool">
      <StoragePoolCreateForm />
    </PageBasic>
  );
};

export default StoragePoolCreate;
