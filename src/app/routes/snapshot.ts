// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { AppRouteConfig } from './routes';

import List from '@app/pages/Snapshot';

const snapshot: AppRouteConfig[] = [
  {
    component: List,
    exact: true,
    label: 'snapshot',
    path: '/snapshot',
    title: 'LINSTOR | Snapshot',
  },
];

export default snapshot;
