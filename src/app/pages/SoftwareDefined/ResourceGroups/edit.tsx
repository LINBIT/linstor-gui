// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useParams } from 'react-router-dom';
import PageBasic from '@app/components/PageBasic';
import { CreateResourceGroupFrom } from '@app/features/resourceGroup';

const ResourceGroupEdit: React.FC = () => {
  const { resourceGroup } = useParams() as { resourceGroup: string };
  return (
    <PageBasic title="Edit Resource Group">
      <CreateResourceGroupFrom resourceGroup={resourceGroup} isEdit />
    </PageBasic>
  );
};

export default ResourceGroupEdit;
