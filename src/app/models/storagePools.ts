import { createModel } from '@rematch/core';
import { RootModel } from '.';
import service from '@app/requests';
import { NodeDeleteRequest, NodeInfoType, NodeLitResponse, NodeModifyRequest } from '@app/interfaces/node';
import { ApiCallRcList } from '@app/interfaces/common';
import { notify, notifyList } from '@app/utils/toast';
import { fetchNodeList, fetchNodeStats, lostNodeRequest, updateNodeRequest } from '@app/requests/node';
import { fetchPhysicalStorageList } from '@app/requests/storagePool';

type NodeState = {
  list: NodeLitResponse;
  pageInfo: PageInfo;
};

type PageInfo = {
  currentPage: number;
  pageSize: number;
  total: number;
};

export const storagePools = createModel<RootModel>()({
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
    async getPhysicalStorageList(payload: { node: string }, state) {
      const { node } = payload;

      const PhysicalStorageList = await fetchPhysicalStorageList(node);

      console.log(PhysicalStorageList, 'PhysicalStorageList');
    },
  }),
});
