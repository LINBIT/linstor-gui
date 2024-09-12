import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import axios from 'axios';

const LINSTOR = 'LINSTOR';

type NodeItem = {
  name: string;
};

type NodeState = {
  list: Array<NodeItem>;
  pageInfo: PageInfo;
};

type PageInfo = {
  currentPage: number;
  pageSize: number;
  total: number;
};

export const node = createModel<RootModel>()({
  state: {
    list: [],
    pageInfo: {
      total: 0,
      pageSize: 10,
      currentPage: 1,
    },
  } as NodeState, // initial state
  reducers: {
    // handle state changes with pure functions
    setNodeList(state, payload: NodeState) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: (dispatch) => ({
    async getNodeList(payload: { page: number; pageSize: number }, state) {
      const nodeStats = await service.get('/v1/stats/nodes');

      const res = await service.get('/v1/nodes', {
        params: {
          limit: payload.page - 1,
          offset: payload.pageSize,
        },
      });

      dispatch.node.setNodeList({
        list: res.data,
        pageInfo: {
          ...state.node.pageInfo,
          total: nodeStats.data.count,
          currentPage: payload.page,
          pageSize: payload.pageSize,
        },
      });
    },
    async createNode(payload: { page: number; pageSize: number }, state) {
      try {
        const res = await service.post('/v1/nodes', { ...payload });

        console.log(res, 'createNode');
      } catch (error) {
        console.log(error, '....');
      }
    },
  }),
});
