import service from '@app/requests';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

type Setting = {
  gatewayEnabled: boolean;
};

export const setting = createModel<RootModel>()({
  state: {
    gatewayEnabled: false,
  } as Setting,
  reducers: {
    setGateway(state, payload: boolean) {
      return {
        ...state,
        gatewayEnabled: payload,
      };
    },
  },
  effects: (dispatch) => ({
    async getGatewayStatus(payload: { page: number; pageSize: number }, state) {
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
