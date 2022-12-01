import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { createPhysicalStoragePool } from '../services';

export const storagePools = createModel<RootModel>()({
  state: {},
  reducers: {},
  effects: (dispatch) => ({
    async createPhysicalStoragePool(payload, rootState) {
      const { node, ...params } = payload;
      const { data } = await createPhysicalStoragePool({ node, ...params });
      return data.ret_code > 0;
    },
  }),
});
