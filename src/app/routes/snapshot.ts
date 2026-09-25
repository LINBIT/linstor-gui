// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { lazy } from 'react';

const List = lazy(() => import('@app/pages/Snapshot'));

const snapshot = [
  {
    component: List,
    exact: true,
    label: 'snapshot',
    path: '/snapshot',
    title: 'LINSTOR | Snapshot',
  },
];

export default snapshot;
