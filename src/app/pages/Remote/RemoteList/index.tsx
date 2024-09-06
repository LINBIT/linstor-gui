// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { List } from '@app/features/remote';

const RemoteList = () => {
  return (
    <PageBasic title="Remote List">
      <List />
    </PageBasic>
  );
};

export default RemoteList;
