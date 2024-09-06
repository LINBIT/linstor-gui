// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { StoragePoolEditForm } from '@app/features/storagePool';

const StoragePoolEdit = () => {
  return (
    <PageBasic title="Edit Storage Pool">
      <StoragePoolEditForm />
    </PageBasic>
  );
};

export default StoragePoolEdit;
