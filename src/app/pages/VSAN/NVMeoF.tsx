// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { NVMeoFList } from '@app/features/vsan';

export const NVMeoF = () => {
  return (
    <PageBasic title="NVMe-oF Target Configuration">
      <NVMeoFList complex />
    </PageBasic>
  );
};
