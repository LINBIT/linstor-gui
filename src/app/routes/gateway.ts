import { AppRouteConfig } from './routes';

import NFSList from '@app/pages/Gateway/nfs';
import ISCSIList from '@app/pages/Gateway/iscsi';

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
        component: ISCSIList,
        exact: true,
        label: 'iscsi',
        path: '/gateway/iscsi',
        title: 'Linstor | ISCSI',
      },
    ],
  },
];

export default gateway;
