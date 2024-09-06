// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { createModel } from '@rematch/core';
import { SnapshotList } from '@app/interfaces/snapShot';
import { RootModel } from '.';

type ReportState = {
  list: SnapshotList;
  pageInfo: PageInfo;
};

type PageInfo = {
  currentPage: number;
  pageSize: number;
  total: number;
};

type Data = {
  list: SnapshotList;
};

export const snapshot = createModel<RootModel>()({
  state: {
    pageInfo: {
      total: 0,
      pageSize: 10,
      currentPage: 1,
    },
    list: [],
  } as ReportState, // initial state
  reducers: {
    // handle state changes with pure functions
    setList(state, payload: Data) {
      return {
        ...state,
        ...payload,
      };
    },
    setState(state, payload: ReportState) {
      return {
        ...state,
        ...payload,
      };
    },
    setPageInfo(state, payload: PageInfo) {
      return {
        ...state,
        pageInfo: {
          ...state.pageInfo,
          ...payload,
        },
      };
    },
  },
  effects: (dispatch) => ({
    async getList(payload: any, state) {
      const res = await service.get('/v1/view/snapshots');
      const data = res.data ?? [];
      dispatch.snapshot.setList({
        list: data,
      });
      dispatch.snapshot.setPageInfo({
        total: data.length ? data.length : 0,
        pageSize: 10,
        currentPage: 1,
      });
    },
    async createSnapshot(payload: { resource: string; name: string }, state) {
      try {
        await service.post(`/v1/resource-definitions/${payload.resource}/snapshots`, {
          name: payload.name,
        });
        notify(`${payload.resource} has been created`, {
          type: 'success',
        });
      } catch (error) {
        console.log(error, 'error');
        if (Array.isArray(error)) {
          for (const item of error) {
            notify(String(item.message), {
              type: 'error',
            });
          }
        }
      }
    },
  }),
});
