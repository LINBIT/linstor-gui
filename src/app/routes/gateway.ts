// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { lazy } from 'react';

const ISCSIList = lazy(() => import('@app/pages/Gateway/iscsi'));
const ISCSICreate = lazy(() => import('@app/pages/Gateway/iscsi/Create'));
const NFSList = lazy(() => import('@app/pages/Gateway/nfs'));
const NFSCreate = lazy(() => import('@app/pages/Gateway/nfs/Create'));
const NvmeList = lazy(() => import('@app/pages/Gateway/nvme'));
const NvmeCreate = lazy(() => import('@app/pages/Gateway/nvme/Create'));

const gateway = [
  {
    label: 'gateway',
    routes: [
      {
        component: NFSList,
        exact: true,
        label: 'nfs',
        path: '/gateway/nfs',
        title: 'LINSTOR | NFS',
      },
      {
        component: NFSCreate,
        exact: true,
        path: '/gateway/nfs/create',
        title: 'LINSTOR | NFS',
      },
      {
        component: ISCSIList,
        exact: true,
        label: 'iscsi',
        path: '/gateway/iscsi',
        title: 'LINSTOR | iSCSI',
      },
      {
        component: ISCSICreate,
        exact: true,
        path: '/gateway/iscsi/create',
        title: 'LINSTOR | iSCSI | Create',
      },
      {
        component: NvmeList,
        exact: true,
        label: 'nvme-of',
        path: '/gateway/nvme-of',
        title: 'LINSTOR | NVMe-oF',
      },
      {
        component: NvmeCreate,
        exact: true,
        path: '/gateway/nvme-of/create',
        title: 'LINSTOR | NVMe-oF | Create',
      },
    ],
  },
];

export default gateway;
