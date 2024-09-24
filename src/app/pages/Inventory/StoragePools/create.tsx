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
      <p>
        A storage pool identifies physically-backed storage that LINSTOR storage volumes consume. You can assign a
        storage pool to other LINSTOR objects, such as LINSTOR resources, resource definitions, or resource groups.
        LINSTOR storage volumes created from these objects will consume physical storage from the storage pool assigned
        to the object.
      </p>
      <StoragePoolCreateForm />
    </PageBasic>
  );
};

export default StoragePoolCreate;
