// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { BackUpList } from '@app/features/remote';

const BackupList = () => {
  return (
    <PageBasic title="Backups" showBack>
      <BackUpList />
    </PageBasic>
  );
};

export default BackupList;
