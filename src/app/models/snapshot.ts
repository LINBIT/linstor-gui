import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

type Data = {
  total: number;
  list: any[];
};

export const snapshot = createModel<RootModel>()({
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
      const res = await service.get('/v1/view/snapshots');
      const data = res.data ?? [];
      dispatch.snapshot.setList({
        total: data.length ? data.length - 1 : 0,
        list: data,
      });
    },
  }),
});
