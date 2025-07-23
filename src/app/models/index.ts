// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Models } from '@rematch/core';
import { nfs } from './nfs';
import { setting } from './setting';
import { notification } from './notification';
import { iscsi } from './iscsi';
import { nvme } from './nvme';
import { storagePools } from './storagePools';
import { auth } from './auth';

export interface RootModel extends Models<RootModel> {
  nfs: typeof nfs;
  setting: typeof setting;
  notification: typeof notification;
  iscsi: typeof iscsi;
  nvme: typeof nvme;
  storagePools: typeof storagePools;
  auth: typeof auth;
}

export const models: RootModel = {
  nfs,
  setting,
  notification,
  iscsi,
  nvme,
  storagePools,
  auth,
};
