import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

import { NodeItem, NodeInfoType } from '@app/interfaces/node';
import { AlertType } from '@app/interfaces/alert';
import { notify } from '@app/utils/toast';

type NodeState = {
  list: NodeItem[];
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
    async createNode(payload: NodeInfoType) {
      // indicate create success or not
      let res = false;

      // reset alerts
      dispatch.notification.setNotificationList([]);

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

        const result = await service.post('/v1/nodes', { ...data });

        dispatch.notification.setNotificationList(result.data as AlertType[]);

        res = true;
      } catch (error) {
        console.log(error, '??');

        if (Array.isArray(error)) {
          for (const item of error) {
            notify(String(item.message), {
              type: 'error',
            });
          }
        }

        res = false;
      }

      return res;
    },
    async deleteNode(payload: string[], state) {
      try {
        for (const node of payload) {
          const res = await service.delete(`/v1/nodes/${node}`);
          dispatch.notification.setNotificationList(res.data);
        }

        dispatch.node.getNodeList({
          page: state.node.pageInfo.currentPage,
          pageSize: state.node.pageInfo.pageSize,
        });
      } catch (error) {
        dispatch.notification.setNotificationList(error as AlertType[]);
      }
    },
  }),
});
