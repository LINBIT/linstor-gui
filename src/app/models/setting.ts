import service from '@app/requests';
import { convertToBoolean } from '@app/utils/object';
import { notify } from '@app/utils/toast';
import { createModel } from '@rematch/core';
import isSvg from 'is-svg';
import S from 'string';
import { RootModel } from '.';

import { settingAPI, SettingsAPI, SettingsProps } from '@app/features/settings';
import { kvStore } from '@app/features/keyValueStore';

// Use "__gui__settings" namespace of key-value-store(KVS) for saving settings
// KVS only stores values as string
const SETTING_KEY = '__gui__settings';
const GATEWAY_HOST = 'GATEWAY_HOST';

type Setting = {
  gatewayAvailable?: boolean;
  KVS?: SettingsProps;
  initialized?: boolean;
  logo?: string;
};

export const setting = createModel<RootModel>()({
  state: {
    gatewayAvailable: false,
    KVS: {},
    initialized: false,
    logo: '',
  } as Setting,
  reducers: {
    setGatewayAvailable(state, payload: boolean) {
      return {
        ...state,
        gatewayAvailable: payload,
      };
    },
    setSettings(state, payload: SettingsProps) {
      return {
        ...state,
        KVS: {
          ...payload,
        },
      };
    },
    setInitialized(state, payload: boolean) {
      return {
        ...state,
        initialized: payload,
      };
    },
    updateLogo(state, payload: string) {
      return {
        ...state,
        logo: payload,
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

    async initSettingStore() {
      const res = await SettingsAPI.instanceExists();
      dispatch.setting.setInitialized(res);

      if (res) {
        await dispatch.setting.getSettings();
      } else {
        await SettingsAPI.init();
      }
    },

    async getSettings() {
      try {
        const props = await settingAPI.getProps();
        console.log(props, 'props');

        // keep store info in redux
        dispatch.setting.setSettings(props);

        if (props.gatewayEnabled) {
          const defaultGatewayHost = window.location.protocol + '//' + window.location.hostname + ':8080/';
          if (props.gatewayHostAddress !== '') {
            window.localStorage.setItem(GATEWAY_HOST, String(props.gatewayHostAddress));
          } else {
            window.localStorage.setItem(GATEWAY_HOST, defaultGatewayHost);
          }
        } else {
          window.localStorage.removeItem(GATEWAY_HOST);
        }
        // // put logo string together
        if (props.customLogoEnabled) {
          const logoProps = await kvStore.get('logo');
          console.log(logoProps, 'logoProps');
          const logoStr = logoProps?.props?.['logoStr'] ?? '';
          const arr = S(logoStr).parseCSV();
          const logoSrc = arr.map((e) => logoProps?.props?.[e]).join('');

          dispatch.setting.updateLogo(logoSrc);
        }
      } catch (error) {
        console.log(error);
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

    async setDashboard({ dashboardEnabled, host }: { dashboardEnabled: boolean; host: string }) {
      try {
        await dispatch.setting.saveKey({
          dashboardEnabled,
          dashboardURL: host,
        });

        notify('Success', {
          type: 'success',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        notify('Error', {
          type: 'error',
        });
      }
    },

    async setLogo(payload: { logoSvg: string }, state) {
      // delete old logo
      // const { logoStr } = state.setting.KVS;
      // if (logoStr) {
      //   const arr = S(logoStr).parseCSV();
      //   await dispatch.setting.deleteKey([...arr, 'logoStr']);
      // }

      // check logo store is exist

      const override_props = {
        logoStr: '',
      };

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
          override_props[`logoSvg_${i}`] = element;
        }

        override_props['logoStr'] = keyStr;
      }

      await kvStore.create('logo', {
        override_props,
      });

      await settingAPI.setProps({
        customLogoEnabled: true,
      });
    },

    async getLogo(payload: string) {
      await dispatch.setting.saveKey({
        logo: payload,
      });
    },
  }),
});
