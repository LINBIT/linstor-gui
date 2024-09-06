// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { CreateNodeForm } from '@app/features/node';

const NodeEdit: React.FC = () => {
  return (
    <PageBasic title="Edit Node">
      <CreateNodeForm editing />
    </PageBasic>
  );
};

export default NodeEdit;
