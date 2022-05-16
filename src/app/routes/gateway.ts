import { AppRouteConfig } from './routes';

import ISCSIList from '@app/pages/Gateway/iscsi';
import ISCSICreate from '@app/pages/Gateway/iscsi/Create';
import NFSList from '@app/pages/Gateway/nfs';
import NFSCreate from '@app/pages/Gateway/nfs/Create';
import NvmeList from '@app/pages/Gateway/nvme';
import NvmeCreate from '@app/pages/Gateway/nvme/Create';

const gateway: AppRouteConfig[] = [
  {
    label: 'gateway',
    routes: [
      {
        component: NFSList,
        exact: true,
        label: 'nfs',
        path: '/gateway/nfs',
        title: 'Linstor | NFS',
      },
      {
        component: NFSCreate,
        exact: true,
        path: '/gateway/nfs/create',
        title: 'Linstor | NFS',
      },
      {
        component: ISCSIList,
        exact: true,
        label: 'iscsi',
        path: '/gateway/iscsi',
        title: 'Linstor | ISCSI',
      },
      {
        component: ISCSICreate,
        exact: true,
        path: '/gateway/iscsi/create',
        title: 'Linstor | ISCSI',
      },
      {
        component: NvmeList,
        exact: true,
        label: 'nvme-of',
        path: '/gateway/nvme-of',
        title: 'Linstor | NVME',
      },
      {
        component: NvmeCreate,
        exact: true,
        path: '/gateway/nvme-of/create',
        title: 'Linstor | NVME',
      },
    ],
  },
];

export default gateway;
