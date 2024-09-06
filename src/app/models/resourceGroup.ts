// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

type Data = {
  total: number;
  list: any[];
};

export const resourceGroup = createModel<RootModel>()({
  state: {
    total: 0,
    list: [],
  } as Data, // initial state
  reducers: {
    // handle state changes with pure functions
    setList(state, payload: Data) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: (dispatch) => ({
    async getList(payload: any, state) {
      const res = await service.get('/v1/resource-groups');
      const data = res.data ?? [];
      dispatch.resourceGroup.setList({
        total: data.length - 1,
        list: data,
      });
    },
  }),
});
