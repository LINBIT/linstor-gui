import { createModel } from '@rematch/core';
import { RootModel } from '.';
import service from '@app/requests';
import { NodeDeleteRequest, NodeInfoType, NodeLitResponse } from '@app/interfaces/node';
import { ApiCallRcList } from '@app/interfaces/common';
import { notify } from '@app/utils/toast';
import { fetchNodeList, fetchNodeStats, lostNodeRequest } from '@app/requests/node';

type NodeState = {
  list: NodeLitResponse;
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
    setNodeList(state, payload: NodeState) {
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
    async getNodeList(payload: { page: number; pageSize: number }, state) {
      const { page, pageSize } = payload;

      const nodeStats = await fetchNodeStats();
      const nodeList = await fetchNodeList({ offset: pageSize, limit: page - 1 });

      dispatch.node.setNodeList({
        list: nodeList.data,
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

        const result = await service.post<unknown, { data: ApiCallRcList }>('/v1/nodes', { ...data });

        for (const item of result.data) {
          notify(String(item.message), {
            type: item.ret_code > 0 ? 'success' : 'error',
          });
        }

        res = true;
      } catch (error) {
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
          const res = await service.delete<NodeDeleteRequest, { data: ApiCallRcList }>(`/v1/nodes/${node}`);
          for (const item of res.data) {
            notify(String(item.message), {
              type: item.ret_code > 0 ? 'success' : 'error',
            });
          }
        }

        dispatch.node.getNodeList({
          page: state.node.pageInfo.currentPage,
          pageSize: state.node.pageInfo.pageSize,
        });
      } catch (error) {
        notify('Error', {
          type: 'error',
        });
      }
    },
    async lostNode(payload: string[], state) {
      try {
        for (const node of payload) {
          const res = await lostNodeRequest({ node });
          for (const item of res.data) {
            notify(String(item.message), {
              type: item.ret_code > 0 ? 'success' : 'error',
            });
          }
        }

        dispatch.node.getNodeList({
          page: state.node.pageInfo.currentPage,
          pageSize: state.node.pageInfo.pageSize,
        });
      } catch (error) {
        notify('Error', {
          type: 'error',
        });
      }
    },
  }),
});
