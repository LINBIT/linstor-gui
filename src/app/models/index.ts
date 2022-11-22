import { Models } from '@rematch/core';
import { nfs } from './nfs';
import { node } from './node';
import { setting } from './setting';
import { notification } from './notification';
import { iscsi } from './iscsi';
import { nvme } from './nvme';
import { report } from './report';
import { resourceGroup } from './resourceGroup';
import { snapshot } from './snapshot';
import { storagePools } from './storagePools';

export interface RootModel extends Models<RootModel> {
  nfs: typeof nfs;
  node: typeof node;
  setting: typeof setting;
  notification: typeof notification;
  iscsi: typeof iscsi;
  report: typeof report;
  nvme: typeof nvme;
  resourceGroup: typeof resourceGroup;
  snapshot: typeof snapshot;
  storagePools: typeof storagePools;
}

export const models: RootModel = {
  nfs,
  node,
  setting,
  notification,
  iscsi,
  report,
  nvme,
  resourceGroup,
  snapshot,
  storagePools,
};
