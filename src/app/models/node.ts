import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { NodeItem, NodeInfoType } from '@app/interfaces/node';
import { AlertType } from '@app/interfaces/error';

type NodeState = {
  list: NodeItem[];
  pageInfo: PageInfo;
  alerts: AlertType[];
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
    alerts: [],
  } as NodeState, // initial state
  reducers: {
    // handle state changes with pure functions
    setNodeList(state, payload: NodeState) {
      return {
        ...state,
        ...payload,
      };
    },
    // handle request error
    setErrorList(state, payload: AlertType[]) {
      return {
        ...state,
        error: payload,
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
        alerts: [],
      });
    },
    async createNode(payload: NodeInfoType, state) {
      dispatch.node.setErrorList([]);
      try {
        const data = {
          name: payload.node,
          type: 'SATELLITE',
          net_interfaces: [
            {
              name: 'default',
              address: payload.ip,
              satellite_port: Number(payload.port),
              satellite_encryption_type: 'Plain',
              is_active: true,
            },
          ],
        };
        await service.post('/v1/nodes', { ...data });
      } catch (error) {
        console.log(error, 'error....');
        dispatch.node.setErrorList(error as AlertType[]);
      }
    },
  }),
});
