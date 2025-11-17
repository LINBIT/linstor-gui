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
import { KV_NAMESPACES } from '@app/const/kvstore';
import { UserAuthAPI } from '@app/features/authentication/api';
import { GRAFANA_KEY_VALUE_STORE_KEY, USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';

const defaultGatewayHost = window.location.protocol + '//' + window.location.hostname + ':8080/';

export interface GrafanaConfig {
  enable: boolean;
  baseUrl: string;
  dashboardUid?: string;
  dashboardTitle?: string;
  datasourceId?: string;
  datasourceName?: string;
  panelIds: {
    cpu?: number;
    memory?: number;
    network?: number;
    disk?: number;
    diskIops?: number;
    ioUsage?: number;
  };
  // Full dashboard URL template with ${node} placeholder
  dashboardUrlTemplate?: string;
  // DRBD dashboard configuration
  drbdEnable?: boolean;
  drbdUrl?: string;
  drbdUid?: string;
  drbdWriteRatePanelId?: number;
  drbdReadRatePanelId?: number;
}

// Use "__gui__settings" namespace of key-value-store(KVS) for saving settings
// KVS only stores values as string
const SETTING_KEY = KV_NAMESPACES.SETTINGS;
const GATEWAY_HOST = 'GATEWAY_HOST';
const HCI_VSAN_HOST = 'HCI_VSAN_HOST';

const authAPI = new UserAuthAPI();

// Helper functions to generate Grafana dashboard URLs
const generateGrafanaDashboardUrl = (uid: string): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3000/d/${uid}/node-exporter-full?orgId=1&refresh=1m`;
};

const generateDrbdDashboardUrl = (uid: string): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3000/d/${uid}/drbd?orgId=1&refresh=30s`;
};

export enum UIMode {
  NORMAL = 'NORMAL',
  VSAN = 'VSAN',
  HCI = 'HCI',
}

type Setting = {
  gatewayAvailable?: boolean;
  KVS?: SettingsProps;
  initialized?: boolean;
  logo?: string;
  mode?: UIMode;
  isAdmin?: boolean;
  // VSAN Eval Mode
  evalMode?: boolean;
  isEvalContract?: boolean;
  // VSAN Available
  vsanAvailable?: boolean;
  // Grafana configuration
  grafanaConfig?: GrafanaConfig | null;
};

export const setting = createModel<RootModel>()({
  state: {
    gatewayAvailable: false,
    KVS: {},
    initialized: false,
    logo: '',
    mode: UIMode.NORMAL,
    isAdmin: false,
    evalMode: false,
    isEvalContract: false,
    vsanAvailable: false,
    grafanaConfig: null,
  } as Setting,
  reducers: {
    setGatewayAvailable(state, payload: boolean) {
      return {
        ...state,
        gatewayAvailable: payload,
      };
    },
    setMode(state, payload: UIMode) {
      return {
        ...state,
        mode: payload,
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
    setAdmin(state) {
      return {
        ...state,
        isAdmin:
          state.KVS?.authenticationEnabled &&
          window.localStorage.getItem(USER_LOCAL_STORAGE_KEY) === DEFAULT_ADMIN_USER_NAME,
      };
    },
    setVSANEvalStatus(
      state,
      payload: {
        evalMode: boolean;
        isEvalContract: boolean;
      },
    ) {
      return {
        ...state,
        evalMode: payload.evalMode,
        isEvalContract: payload.isEvalContract,
      };
    },
    setGrafanaConfig(state, payload: GrafanaConfig | null) {
      return {
        ...state,
        grafanaConfig: payload,
      };
    },
  },
  effects: (dispatch) => ({
    async getMyLinbitStatus() {
      try {
        const res = await service.get('/api/frontend/v1/mylinbit/status');
        console.log(res.data, 'mylinbit status');
        const data = res.data;
        dispatch.setting.setVSANEvalStatus({
          evalMode: data.evalMode,
          isEvalContract: data.isEvalContract,
        });
      } catch (error) {
        console.log(error);
      }
    },
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
      } catch {
        dispatch.setting.setGatewayAvailable(false);
      }
      return false;
    },

    async initSettingStore(mode: UIMode) {
      const res = await SettingsAPI.instanceExists();

      const userStore = await kvStore.instanceExists(KV_NAMESPACES.LEGACY_USERS);

      if (res) {
        // update mode flags mutually exclusively
        if (mode === UIMode.VSAN) {
          await settingAPI.setProps({ vsanMode: true, hciMode: false, vsanAvailable: true });
        } else if (mode === UIMode.HCI) {
          await settingAPI.setProps({ vsanMode: false, hciMode: true });
        } else {
          await settingAPI.setProps({ vsanMode: false, hciMode: false });
        }
        await dispatch.setting.getSettings();
      } else {
        // initialize backend with vsan flag, and explicitly set both mode props
        await SettingsAPI.init(mode);
        await settingAPI.setProps({ vsanMode: mode === UIMode.VSAN, hciMode: mode === UIMode.HCI });

        await dispatch.setting.getSettings();
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
          dispatch.setting.setMode(UIMode.VSAN);
        } else if (props.hciMode) {
          dispatch.setting.setMode(UIMode.HCI);
        } else {
          dispatch.setting.setMode(UIMode.NORMAL);
        }
        if (props.vsanMode || props.hciMode) {
          const host = window.localStorage.getItem(HCI_VSAN_HOST);
          if (!host) {
            window.localStorage.setItem(HCI_VSAN_HOST, 'https://' + window.location.hostname);
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
        // put logo string together
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

        // Load Grafana configuration from __grafana__ui__settings namespace
        try {
          // Check if namespace exists first
          const namespaceExists = await kvStore.instanceExists(GRAFANA_KEY_VALUE_STORE_KEY);

          if (namespaceExists) {
            const grafanaProps = await kvStore.get(GRAFANA_KEY_VALUE_STORE_KEY);

            if (grafanaProps?.props) {
              const grafanaConfig = grafanaProps.props;

              // KV store returns values as strings
              const isEnabled = String(grafanaConfig.enable) === 'true';

              if (isEnabled) {
                // Auto-generate missing URLs if UID exists
                const urlsToUpdate: Record<string, string> = {};
                let dashboardUrl = grafanaConfig.dashboardUrl as string;
                let drbdUrl = grafanaConfig.drbdUrl as string;

                // Check and generate dashboardUrl if missing
                if (!dashboardUrl && grafanaConfig.dashboardUid) {
                  dashboardUrl = generateGrafanaDashboardUrl(grafanaConfig.dashboardUid as string);
                  urlsToUpdate.dashboardUrl = dashboardUrl;
                  console.log('Auto-generated missing dashboardUrl:', dashboardUrl);
                }

                // Check and generate drbdUrl if missing and DRBD is enabled
                const isDrbdEnabled = String(grafanaConfig.drbdEnable) === 'true';
                if (isDrbdEnabled && !drbdUrl && grafanaConfig.drbdUid) {
                  drbdUrl = generateDrbdDashboardUrl(grafanaConfig.drbdUid as string);
                  urlsToUpdate.drbdUrl = drbdUrl;
                  console.log('Auto-generated missing drbdUrl:', drbdUrl);
                }

                // Save auto-generated URLs back to KVS
                if (Object.keys(urlsToUpdate).length > 0) {
                  try {
                    await service.put(`/v1/key-value-store/${GRAFANA_KEY_VALUE_STORE_KEY}`, {
                      override_props: urlsToUpdate,
                    });
                    console.log('Saved auto-generated URLs to KVS:', urlsToUpdate);
                  } catch (saveError) {
                    console.error('Failed to save auto-generated URLs:', saveError);
                    // Continue with the generated URLs even if save fails
                  }
                }

                // Extract baseUrl from dashboardUrl
                let baseUrl = '';
                if (dashboardUrl) {
                  try {
                    const url = new URL(dashboardUrl);
                    baseUrl = `${url.protocol}//${url.host}`;
                  } catch (e) {
                    console.error('Failed to parse dashboardUrl:', e);
                  }
                }

                const config: GrafanaConfig = {
                  enable: isEnabled,
                  baseUrl: baseUrl,
                  dashboardUid: grafanaConfig.dashboardUid as string,
                  panelIds: {
                    cpu: Number(grafanaConfig.panelIdCpu),
                    memory: Number(grafanaConfig.panelIdMemory),
                    network: Number(grafanaConfig.panelIdNetwork),
                    disk: Number(grafanaConfig.panelIdDisk),
                    diskIops: Number(grafanaConfig.panelIdDiskIops),
                    ioUsage: Number(grafanaConfig.panelIdIoUsage),
                  },
                  dashboardUrlTemplate: dashboardUrl,
                  // DRBD configuration
                  drbdEnable: isDrbdEnabled,
                  drbdUrl: drbdUrl,
                  drbdUid: grafanaConfig.drbdUid as string,
                  drbdWriteRatePanelId: Number(grafanaConfig.drbdWriteRatePanelId) || 28,
                  drbdReadRatePanelId: Number(grafanaConfig.drbdReadRatePanelId) || 29,
                };
                dispatch.setting.setGrafanaConfig(config);
              } else {
                dispatch.setting.setGrafanaConfig(null);
              }
            }
          } else {
            // Namespace doesn't exist yet, set config to null
            dispatch.setting.setGrafanaConfig(null);
          }
        } catch (error) {
          console.error('Failed to load Grafana configuration:', error);
        }
      } catch (error) {
        console.log(error);
      }

      dispatch.setting.setAdmin();
    },
    async saveKey(payload: Record<string, number | string | boolean>, _state) {
      console.log('Saving to KV store:', SETTING_KEY, payload);
      try {
        const response = await service.put(`/v1/key-value-store/${SETTING_KEY}`, {
          override_props: {
            ...payload,
          },
        });
        console.log('KV store save response:', response);
        return response;
      } catch (error) {
        console.error('Failed to save to KV store:', error);
        throw error;
      }
    },
    async deleteKey(payload: string[], _state) {
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
      } catch {
        notify('Cannot connect to LINSTOR-Gateway', {
          type: 'error',
        });
      }
    },
    async exitVSANMode() {
      await dispatch.setting.saveKey({ mode: UIMode.VSAN });
      dispatch.setting.setMode(UIMode.NORMAL);
      window.location.reload();
    },

    async saveGrafanaConfig(config: any) {
      try {
        // Save to dedicated __grafana__ui__settings namespace
        const grafanaConfig = {
          enable: config.enable || false,
          dashboardUrl: config.dashboardUrl || '',
          dashboardUid: config.dashboardUid || '',
          panelIdCpu: config.panelIds?.cpu,
          panelIdMemory: config.panelIds?.memory,
          panelIdNetwork: config.panelIds?.network,
          panelIdDisk: config.panelIds?.disk,
          panelIdDiskIops: config.panelIds?.diskIops,
          panelIdIoUsage: config.panelIds?.ioUsage,
          // DRBD configuration
          drbdEnable: config.drbdEnable || false,
          drbdUrl: config.drbdUrl || '',
          drbdUid: config.drbdUid || '',
          drbdWriteRatePanelId: config.drbdWriteRatePanelId || 28,
          drbdReadRatePanelId: config.drbdReadRatePanelId || 29,
        };

        // Check if namespace exists, if not create it first
        const namespaceExists = await kvStore.instanceExists(GRAFANA_KEY_VALUE_STORE_KEY);

        if (!namespaceExists) {
          // Create the namespace with initial config
          await kvStore.create(GRAFANA_KEY_VALUE_STORE_KEY, {
            override_props: grafanaConfig,
          });
        } else {
          // Update existing namespace
          await service.put(`/v1/key-value-store/${GRAFANA_KEY_VALUE_STORE_KEY}`, {
            override_props: grafanaConfig,
          });
        }

        // Update Redux state
        if (config.enable) {
          // Extract baseUrl from dashboardUrl
          let baseUrl = '';
          if (config.dashboardUrl) {
            try {
              const url = new URL(config.dashboardUrl);
              baseUrl = `${url.protocol}//${url.host}`;
            } catch (e) {
              console.error('Failed to parse dashboardUrl:', e);
            }
          }

          const reduxConfig: GrafanaConfig = {
            enable: config.enable,
            baseUrl: baseUrl,
            dashboardUid: config.dashboardUid,
            panelIds: config.panelIds || {},
            dashboardUrlTemplate: config.dashboardUrl,
            // DRBD configuration
            drbdEnable: config.drbdEnable,
            drbdUrl: config.drbdUrl,
            drbdUid: config.drbdUid,
            drbdWriteRatePanelId: config.drbdWriteRatePanelId,
            drbdReadRatePanelId: config.drbdReadRatePanelId,
          };
          dispatch.setting.setGrafanaConfig(reduxConfig);
        } else {
          dispatch.setting.setGrafanaConfig(null);
        }

        notify('Grafana configuration saved', {
          type: 'success',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);

        return true;
      } catch (error) {
        console.error('Failed to save Grafana config:', error);
        notify('Failed to save configuration', {
          type: 'error',
        });
        return false;
      }
    },

    async setLogo(payload: { logoSvg: string; logoUrl?: string }, _state) {
      // delete old logo
      // const { logoStr } = state.setting.KVS;
      // if (logoStr) {
      //   const arr = S(logoStr).parseCSV();
      //   await dispatch.setting.deleteKey([...arr, 'logoStr']);
      // }

      // check logo store is exist

      const override_props: Record<string, string> = {
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
