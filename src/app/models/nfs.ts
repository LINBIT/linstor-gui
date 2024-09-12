import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

type NFSItem = {
  name: string;
};

type NFSList = {
  total: number;
  list: Array<NFSItem>;
};

export const nfs = createModel<RootModel>()({
  state: {
    total: 0,
  } as NFSList, // initial state
  reducers: {
    // handle state changes with pure functions
    setNFSList(state, payload: NFSList) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: (dispatch) => ({
    // handle state changes with impure functions.
    // use async/await for async actions
    async getNFSList(payload: { page: number; pageSize: number }, state) {
      console.log('This is current root state', state);
      const res = await service.get('/api/v2/nfs');
      const data = res.data ?? [];
      console.log(res.data, '???');
      dispatch.nfs.setNFSList({
        total: data.length,
        list: data,
      });
    },
  }),
});
