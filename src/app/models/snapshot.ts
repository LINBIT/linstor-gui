import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { createModel } from '@rematch/core';
import { SnapshotList } from '@app/interfaces/snapShot';
import { RootModel } from '.';

type Data = {
  total: number;
  list: SnapshotList;
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
    async createSnapshot(payload: { resource: string; name: string }, state) {
      try {
        await service.post(`/v1/resource-definitions/${payload.resource}/snapshots`, {
          name: payload.name,
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
