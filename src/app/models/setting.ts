// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { createModel } from '@rematch/core';
import isSvg from 'is-svg';
import { RootModel } from '.';

import { settingAPI, SettingsAPI, SettingsProps } from '@app/features/settings';
import { kvStore } from '@app/features/keyValueStore';
import { UserAuthAPI } from '@app/features/authentication/api';
import { GUI_KEY_VALUE_STORE_KEY, USER_LOCAL_STORAGE_KEY } from '@app/const/settings';

const defaultGatewayHost = window.location.protocol + '//' + window.location.hostname + ':8080/';

// Use "__gui__settings" namespace of key-value-store(KVS) for saving settings
// KVS only stores values as string
const SETTING_KEY = GUI_KEY_VALUE_STORE_KEY;
const GATEWAY_HOST = 'GATEWAY_HOST';
const VSAN_HOST = 'VSAN_HOST';

const authAPI = new UserAuthAPI();

type Setting = {
  gatewayAvailable?: boolean;
  KVS?: SettingsProps;
  initialized?: boolean;
  logo?: string;
  vsanMode?: boolean;
  isAdmin?: boolean;
};

export const setting = createModel<RootModel>()({
  state: {
    gatewayAvailable: false,
    KVS: {},
    initialized: false,
    logo: '',
    vsanMode: false,
    isAdmin: false,
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
    setVSANMode(state, payload: boolean) {
      return {
        ...state,
        vsanMode: payload,
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
    setAdmin(state) {
      return {
        ...state,
        isAdmin: state.KVS?.authenticationEnabled && window.localStorage.getItem(USER_LOCAL_STORAGE_KEY) === 'admin',
      };
    },
  },
  effects: (dispatch) => ({
    async getGatewayStatus(host?: string) {
      if (host) {
        window.localStorage.setItem(GATEWAY_HOST, host);
      }
      try {
        const res = await service.get('/api/v2/status');
        const data = res.data;
        if (data.status === 'ok') {
          dispatch.setting.setGatewayAvailable(true);
          return true;
        } else {
          dispatch.setting.setGatewayAvailable(false);
          return false;
        }
      } catch (error) {
        dispatch.setting.setGatewayAvailable(false);
      }
      return false;
    },

    async initSettingStore(vsanMode: boolean) {
      const res = await SettingsAPI.instanceExists();

      const userStore = await kvStore.instanceExists('users');

      if (res) {
        if (vsanMode) {
          await settingAPI.setProps({
            vsanMode: true,
          });
        }
        await dispatch.setting.getSettings();
      } else {
        await SettingsAPI.init(vsanMode);
      }

      if (!userStore) {
        authAPI.initUserStore();
      }

      dispatch.setting.setInitialized(res);
    },

    async getSettings() {
      try {
        const res = await SettingsAPI.instanceExists();
        if (!res) {
          return;
        }
        const props = await settingAPI.getProps();

        // keep store info in redux
        dispatch.setting.setSettings(props);

        if (props.vsanMode) {
          const gui_mode = localStorage.getItem('__gui_mode');
          if (gui_mode === 'VSAN') {
            dispatch.setting.setVSANMode(true);
          }

          // allow user to set VSAN_HOST
          const host = window.localStorage.getItem(VSAN_HOST);

          if (!host) {
            window.localStorage.setItem(VSAN_HOST, 'https://' + window.location.hostname);
          }
        }

        if (props.gatewayEnabled) {
          if (props.gatewayHost !== '') {
            window.localStorage.setItem(GATEWAY_HOST, String(props.gatewayHost));
          } else {
            window.localStorage.setItem(GATEWAY_HOST, defaultGatewayHost);
          }
        } else {
          window.localStorage.removeItem(GATEWAY_HOST);
        }
        // // put logo string together
        if (props.customLogoEnabled) {
          const logoProps = await kvStore.get('logo');

          const logoStr = logoProps?.props?.['logoStr'] ?? '';
          const logoUrl = logoProps?.props?.['logoUrl'] ?? '';
          console.log(logoStr, logoUrl);

          if (logoUrl !== '') {
            dispatch.setting.updateLogo(logoUrl);
          } else {
            const arr = logoStr.split(',');

            const logoSrc = arr.map((e) => logoProps?.props?.[e]).join('');

            dispatch.setting.updateLogo(logoSrc);
          }
        }
      } catch (error) {
        console.log(error);
      }

      dispatch.setting.setAdmin();
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
    async setGatewayMode(
      {
        gatewayEnabled,
        customHost,
        host,
        showToast,
      }: {
        gatewayEnabled: boolean;
        customHost: boolean;
        host: string;
        showToast?: boolean;
      },
      state,
    ) {
      try {
        const gatewayAvailable = state.setting.gatewayAvailable;

        await dispatch.setting.saveKey({
          gatewayEnabled,
          gatewayCustomHost: gatewayEnabled && customHost,
        });

        if (gatewayEnabled && customHost) {
          await dispatch.setting.saveKey({
            gatewayHost: host,
          });
        } else {
          await dispatch.setting.saveKey({
            gatewayHost: '',
            gatewayCustomHost: false,
          });
        }

        if (showToast) {
          notify(`LINSTOR-Gateway ${gatewayEnabled ? 'enabled' : 'disabled'}!`, {
            type: 'success',
          });
        }

        if (gatewayAvailable) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (gatewayEnabled) {
          notify('LINSTOR-Gateway is not available. To ensure functionality, installing linstor-gateway is required.', {
            type: 'warning',
          });
        } else {
          notify('LINSTOR-Gateway configuration has been reset.', {
            type: 'success',
          });
        }
      } catch (error) {
        notify('Cannot connect to LINSTOR-Gateway', {
          type: 'error',
        });
      }
    },
    async exitVSANMode() {
      await dispatch.setting.saveKey({
        vsanMode: false,
      });
      dispatch.setting.setVSANMode(false);
      // reload page and remove search params
      window.location.reload();
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

    async setLogo(payload: { logoSvg: string; logoUrl?: string }, state) {
      // delete old logo
      // const { logoStr } = state.setting.KVS;
      // if (logoStr) {
      //   const arr = S(logoStr).parseCSV();
      //   await dispatch.setting.deleteKey([...arr, 'logoStr']);
      // }

      // check logo store is exist

      const override_props = {
        logoStr: '',
        logoUrl: '',
      };

      if (payload.logoUrl) {
        override_props['logoUrl'] = payload.logoUrl;
      } else {
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
      }

      await kvStore.create('logo', {
        override_props,
      });

      await settingAPI.setProps({
        customLogoEnabled: true,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },

    async getLogo(payload: string) {
      await dispatch.setting.saveKey({
        logo: payload,
      });
    },

    async disableCustomLogo() {
      await settingAPI.setProps({
        customLogoEnabled: false,
      });
      window.location.reload();
    },
  }),
});
