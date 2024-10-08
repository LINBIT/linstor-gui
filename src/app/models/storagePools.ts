// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { createPhysicalStorage } from '@app/features/storagePool';

export const storagePools = createModel<RootModel>()({
  state: {},
  reducers: {},
  effects: () => ({
    async createPhysicalStoragePool(payload) {
      const { node, ...params } = payload;
      const { data } = await createPhysicalStorage(node, {
        ...params,
        node,
      });
      if (data) {
        return data[0].ret_code > 0;
      }
      return false;
    },
  }),
});
