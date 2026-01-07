// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Models } from '@rematch/core';
import { nfs } from './nfs';
import { setting } from './setting';
import { iscsi } from './iscsi';
import { nvme } from './nvme';
import { auth } from './auth';

export interface RootModel extends Models<RootModel> {
  nfs: typeof nfs;
  setting: typeof setting;
  iscsi: typeof iscsi;
  nvme: typeof nvme;
  auth: typeof auth;
}

export const models: RootModel = {
  nfs,
  setting,
  iscsi,
  nvme,
  auth,
};
