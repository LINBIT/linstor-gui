// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { lazy } from 'react';

const FilesList = lazy(() => import('@app/pages/Files'));
const CreateFile = lazy(() => import('@app/pages/Files/create'));

const files = [
  {
    component: FilesList,
    exact: true,
    label: 'files',
    path: '/files',
    title: 'LINSTOR | Files',
  },
  {
    component: CreateFile,
    exact: true,
    path: '/files/create',
    title: 'LINSTOR | Files | Create',
  },
  // HCI mode routes
  {
    component: FilesList,
    exact: true,
    label: 'files',
    path: '/hci/files',
    title: 'LINSTOR | Files',
  },
  {
    component: CreateFile,
    exact: true,
    path: '/hci/files/create',
    title: 'LINSTOR | Files | Create',
  },
];

export default files;
