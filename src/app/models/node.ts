// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createModel } from '@rematch/core';
import { RootModel } from '.';
import service from '@app/requests';
import { NodeDeleteRequest, NodeInfoType, NodeLitResponse, NodeModifyRequest } from '@app/interfaces/node';
import { ApiCallRcList } from '@app/interfaces/common';
import { notify, notifyList } from '@app/utils/toast';
import { fetchNodeList, fetchNodeStats, lostNodeRequest, updateNodeRequest } from '@app/requests/node';

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
    async getNodeList(payload: { page: number; pageSize: number; nodes?: string[] }, state) {
      const { page, pageSize, nodes } = payload;

      const nodeStats = await fetchNodeStats();
      const nodeList = await fetchNodeList({ offset: pageSize, limit: page - 1, nodes });

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

        notifyList(result.data);

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

    async updateNode(payload: { node: string; data: NodeModifyRequest }, state) {
      try {
        const result = await updateNodeRequest(payload.node, payload.data);
        dispatch.node.getNodeList({
          page: state.node.pageInfo.currentPage,
          pageSize: state.node.pageInfo.pageSize,
        });
        notifyList(result.data);
      } catch (error) {
        console.log(error);
      }
    },

    async deleteNode(payload: string[], state) {
      try {
        for (const node of payload) {
          const result = await service.delete<NodeDeleteRequest, { data: ApiCallRcList }>(`/v1/nodes/${node}`);
          notifyList(result.data);
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
          const result = await lostNodeRequest({ node });
          notifyList(result.data);
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
