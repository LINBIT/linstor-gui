import service from '@app/requests';
import { convertToBoolean } from '@app/utils/object';
import { notify } from '@app/utils/toast';
import { createModel } from '@rematch/core';
import isSvg from 'is-svg';
import S from 'string';
import { RootModel } from '.';

// Use "settings" namespace of key-value-store(KVS) for saving settings
// KVS only stores values as string
const SETTING_KEY = 'settings';
const GATEWAY_HOST = 'GATEWAY_HOST';

type Setting = {
  gatewayAvailable: boolean;
  KVS: Record<string, boolean | string>;
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
    setSettings(state, payload: Record<string, boolean | string>) {
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
      const props = convertToBoolean(settings.props);
      // keep store info in redux
      dispatch.setting.setSettings(props);

      if (props.gatewayEnabled) {
        const defaultGatewayHost = window.location.protocol + '//' + window.location.hostname + ':8080/';
        if (props.gatewayHost !== '') {
          window.localStorage.setItem(GATEWAY_HOST, String(props.gatewayHost));
        } else {
          window.localStorage.setItem(GATEWAY_HOST, defaultGatewayHost);
        }
      } else {
        window.localStorage.removeItem(GATEWAY_HOST);
      }
      // put logo string together
      if (props.logoStr) {
        const arr = S(props.logoStr).parseCSV();
        const logoSrc = arr.map((e) => props[e]).join('');

        dispatch.setting.setSettings({
          logoSrc,
          logoStr: props.logoStr,
        });
      }
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
    async setGatewayMode({
      gatewayEnabled,
      customHost,
      host,
    }: {
      gatewayEnabled: boolean;
      customHost: boolean;
      host: string;
    }) {
      try {
        await dispatch.setting.saveKey({
          gatewayEnabled,
          customHost: gatewayEnabled && customHost,
        });

        if (gatewayEnabled && customHost) {
          await dispatch.setting.saveKey({
            gatewayHost: host,
          });
        } else {
          await dispatch.setting.saveKey({
            gatewayHost: '',
            customHost: false,
          });
        }

        notify(`LINSTOR-Gateway ${gatewayEnabled ? 'enabled' : 'disabled'}!`, {
          type: 'success',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        notify('Cannot connect to LINSTOR-Gateway', {
          type: 'error',
        });
      }
    },

    async setLogo(payload: { logoSvg: string }, state) {
      // delete old logo
      const { logoStr } = state.setting.KVS;
      if (logoStr) {
        const arr = S(logoStr).parseCSV();
        await dispatch.setting.deleteKey([...arr, 'logoStr']);
      }

      const splitString = (str: string) => {
        const strArr: string[] = [];
        let index = 0;
        while (index < str.length) {
          strArr.push(str.slice(index, index + 4096));
          index += 4096;
        }
        return strArr;
      };

      if (isSvg(payload.logoSvg)) {
        const chunks = splitString(payload.logoSvg);
        const keyStr = chunks.map((_, i) => `logoSvg_${i}`).join(',');

        for (let i = 0; i < chunks.length; i++) {
          const element = chunks[i];
          await dispatch.setting.saveKey({
            [`logoSvg_${i}`]: element,
          });
        }

        await dispatch.setting.saveKey({
          logoStr: keyStr,
        });

        // get settings again to update logoSrc
        await dispatch.setting.getSettings();

        notify('Logo updated!', {
          type: 'success',
        });
      }
    },

    async getLogo(payload: string) {
      await dispatch.setting.saveKey({
        logo: payload,
      });
    },
  }),
});
