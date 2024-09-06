// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { ISCSIList } from '@app/features/vsan';

export const ISCSI = () => {
  return (
    <PageBasic title="iSCSI Target Configuration">
      <ISCSIList complex />
    </PageBasic>
  );
};
