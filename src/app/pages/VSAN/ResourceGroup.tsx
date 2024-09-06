// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import PageBasic from '@app/components/PageBasic';
import React from 'react';
import { ResourceGroupList } from '@app/features/vsan';

export const ResourceGroup = () => {
  return (
    <PageBasic title="Resource groups">
      <p>
        Here you can create resource groups from your storage pools.
        <br />
        A resource group is a LINSTOR concept. It can be thought of as a template for resource creation. It defines a
        storage pool to use and how many replicas of the data to create.
        <br />
        When the resource group is instantiated, for example, when it is used to spawn a resource, LINSTOR will
        automatically take storage from the specified storage pool and place the resource on the appropriate number of
        nodes.
      </p>

      <ResourceGroupList />
    </PageBasic>
  );
};
