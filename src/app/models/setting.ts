import service from '@app/requests';
import notify from '@app/utils/toast';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

type Setting = {
  gatewayEnabled: boolean;
  gatewayAvailable: boolean;
};

export const setting = createModel<RootModel>()({
  state: {
    gatewayEnabled: false,
    gatewayAvailable: false,
  } as Setting,
  reducers: {
    setGateway(state, payload: boolean) {
      return {
        ...state,
        gatewayEnabled: payload,
      };
    },
    setGatewayAvailable(state, payload: boolean) {
      return {
        ...state,
        gatewayAvailable: payload,
      };
    },
  },
  effects: (dispatch) => ({
    async getGatewayStatus() {
      const res = await service.get('/api/v2/status');
      const data = res.data;
      if (data.status !== 'ok') {
        dispatch.setting.setGatewayAvailable(true);
        notify('You can enable gateway!', {
          type: 'success',
        });
      } else {
        notify('Can not connect to gateway!', {
          type: 'error',
        });
      }
    },
  }),
});
