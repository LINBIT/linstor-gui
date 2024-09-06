// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { NFSExportList } from '@app/features/vsan';

export const NFS = () => {
  return (
    <PageBasic title="NFS Export Configuration">
      <NFSExportList complex />
    </PageBasic>
  );
};
