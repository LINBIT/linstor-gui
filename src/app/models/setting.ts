import service from '@app/requests';
import { convertToBoolean } from '@app/utils/object';
import { notify } from '@app/utils/toast';
import { createModel } from '@rematch/core';
import { RootModel } from '.';

// Use "settings" namespace of key-value-store(KVS) for saving settings
// KVS only stores values as string
const SETTING_KEY = 'settings';

type Setting = {
  gatewayAvailable: boolean;
  KVS: Record<string, boolean>;
};

export const setting = createModel<RootModel>()({
  state: {
    gatewayAvailable: false,
    KVS: {},
  } as Setting,
  reducers: {
    setGatewayAvailable(state, payload: boolean) {
      return {
        ...state,
        gatewayAvailable: payload,
      };
    },
    setSettings(state, payload: Record<string, boolean>) {
      return {
        ...state,
        KVS: {
          ...payload,
        },
      };
    },
  },
  effects: (dispatch) => ({
    async getGatewayStatus() {
      const res = await service.get('/api/v2/status');
      const data = res.data;
      if (data.status === 'ok') {
        dispatch.setting.setGatewayAvailable(true);
      }
    },
    async getSettings() {
      const res = await service.get(`/v1/key-value-store/${SETTING_KEY}`);

      const settings = res.data.find((e) => e.name === SETTING_KEY) || { props: {} };

      // KVS only stores values as string

      dispatch.setting.setSettings(convertToBoolean(settings.props));
    },
    async saveKey(payload: Record<string, number | string | boolean>, state) {
      await service.put(`/v1/key-value-store/${SETTING_KEY}`, {
        override_props: {
          ...payload,
        },
      });
    },
    async deleteKey(payload: string[], state) {
      await service.put(`/v1/key-value-store/${SETTING_KEY}`, {
        delete_props: payload,
      });
    },
    async setGatewayMode(payload) {
      try {
        await dispatch.setting.saveKey({
          gatewayEnabled: payload,
        });

        notify(`LINSTOR-Gateway ${payload ? 'enabled' : 'disabled'}!`, {
          type: 'success',
        });
      } catch (error) {
        notify('Cannot connect to LINSTOR-Gateway', {
          type: 'error',
        });
      }

      window.location.reload();
    },
  }),
});
