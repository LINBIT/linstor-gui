import { AppRouteConfig } from './routes';

import NFSList from '@app/pages/Gateway/nfs';

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
    ],
  },
];

export default gateway;
