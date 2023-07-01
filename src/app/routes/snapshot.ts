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
