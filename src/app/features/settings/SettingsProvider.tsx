// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import service from '@app/requests';
import { logger } from '@app/utils/logger';
import { notify } from '@app/utils/toast';
import { kvStore } from '@app/features/keyValueStore';
import authAPI from '@app/features/authentication/api';
import { USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';

import settingAPI, { SettingsAPI, type SettingsProps } from './SettingsAPI';
import {
  loadGuiSettings,
  modeOf,
  saveGrafanaConfig as writeGrafanaConfig,
  saveLogo,
  saveSettingKeys,
} from './guiSettings';
import { UIMode, type GrafanaConfigInput } from './types';
import { GUI_SETTINGS_QUERY_KEY, SettingsContext, type SettingsContextValue } from './useSettings';

const GATEWAY_HOST = 'GATEWAY_HOST';
const HCI_VSAN_HOST = 'HCI_VSAN_HOST';
const RELOAD_DELAY_MS = 1000;

const defaultGatewayHost = () => `${window.location.protocol}//${window.location.hostname}:8337/`;

const reloadSoon = () => setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);

const computeIsAdmin = (KVS: Partial<SettingsProps>) =>
  Boolean(KVS.authenticationEnabled) && window.localStorage.getItem(USER_LOCAL_STORAGE_KEY) === DEFAULT_ADMIN_USER_NAME;

/**
 * GUI settings for the whole app. The stored settings (key-value store) are a
 * react-query cache entry; mode, admin flag and gateway reachability are client
 * state derived from them. Replaces the former rematch `setting` model, whose
 * dispatchers map one-to-one onto the actions here.
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data, isFetched, refetch } = useQuery({
    queryKey: GUI_SETTINGS_QUERY_KEY,
    queryFn: loadGuiSettings,
    // Settings change only through this GUI, which refreshes after writing.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // One attempt, as before: the default three retries would hold up every
    // refresh (and initSettingStore) for seconds when the controller is down.
    retry: false,
  });

  const KVS = useMemo(() => data?.KVS ?? {}, [data]);
  const [mode, setMode] = useState<UIMode>(UIMode.NORMAL);
  const [isAdmin, setIsAdmin] = useState(false);
  const [gatewayAvailable, setGatewayAvailable] = useState(false);
  const [checkingGateway, setCheckingGateway] = useState(false);
  const [evalStatus, setEvalStatus] = useState({ evalMode: false, isEvalContract: false });

  // Probes overlap (the load's own probe, the Gateway tab, its host check):
  // checkingGateway stays on until the last one ends, and only the most
  // recently started probe may set gatewayAvailable.
  const probesInFlight = useRef(0);
  const latestProbe = useRef(0);
  const getGatewayStatus = useCallback(async (host?: string) => {
    if (host) {
      window.localStorage.setItem(GATEWAY_HOST, host);
    }
    const probe = ++latestProbe.current;
    probesInFlight.current += 1;
    setCheckingGateway(true);
    let ok = false;
    try {
      const res = await service.get('/api/v2/status');
      ok = res.data?.status === 'ok';
    } catch {
      ok = false;
    } finally {
      probesInFlight.current -= 1;
      if (probesInFlight.current === 0) setCheckingGateway(false);
    }
    if (probe === latestProbe.current) setGatewayAvailable(ok);
    return ok;
  }, []);

  // What loading the settings implies for the rest of the app.
  useEffect(() => {
    if (!data) return;
    const props = data.KVS;
    setMode(modeOf(props));
    if ((props.vsanMode || props.hciMode) && !window.localStorage.getItem(HCI_VSAN_HOST)) {
      window.localStorage.setItem(HCI_VSAN_HOST, `https://${window.location.hostname}`);
    }
    if (props.gatewayEnabled) {
      window.localStorage.setItem(GATEWAY_HOST, props.gatewayHost ? String(props.gatewayHost) : defaultGatewayHost());
      // Probe only once the host is known; before that the probe would go to
      // the controller, which answers 404.
      void getGatewayStatus();
    } else {
      window.localStorage.removeItem(GATEWAY_HOST);
      setGatewayAvailable(false);
    }
  }, [data, getGatewayStatus]);

  // refreshAdmin reads the latest settings through a ref so it stays one
  // function for the app's lifetime; the auth actions built on it (and the
  // effects that depend on them) then do not re-run when the settings load.
  const kvsRef = useRef(KVS);
  useEffect(() => {
    kvsRef.current = KVS;
    setIsAdmin(computeIsAdmin(KVS));
  }, [KVS]);

  // refetch never throws; a failed load keeps the last data.
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const saveKey = useCallback(
    async (props: Record<string, number | string | boolean>) => {
      try {
        const res = await saveSettingKeys(props);
        // The cache never goes stale on its own, so every write refreshes it.
        void queryClient.invalidateQueries({ queryKey: GUI_SETTINGS_QUERY_KEY });
        return res;
      } catch (error) {
        logger.error('Failed to save to KV store:', error);
        throw error;
      }
    },
    [queryClient],
  );

  const initSettingStore = useCallback(
    async (nextMode: UIMode) => {
      const exists = await SettingsAPI.instanceExists();
      if (!exists) {
        await SettingsAPI.init(nextMode);
      }
      // Mode flags are mutually exclusive.
      await settingAPI.setProps({
        vsanMode: nextMode === UIMode.VSAN,
        hciMode: nextMode === UIMode.HCI,
        vsanAvailable: nextMode === UIMode.VSAN,
      });
      await refresh();

      // Only initialise the user store when authentication is on.
      const settings = await settingAPI.getProps();
      if (settings.authenticationEnabled && !(await kvStore.instanceExists(authAPI.usersInstance))) {
        await authAPI.initUserStore();
      }
    },
    [refresh],
  );

  const setGatewayMode = useCallback<SettingsContextValue['setGatewayMode']>(
    async ({ gatewayEnabled, customHost, host, showToast }) => {
      try {
        await saveKey({ gatewayEnabled, gatewayCustomHost: gatewayEnabled && customHost });
        await saveKey(
          gatewayEnabled && customHost ? { gatewayHost: host } : { gatewayHost: '', gatewayCustomHost: false },
        );

        if (showToast) {
          notify(`LINSTOR-Gateway ${gatewayEnabled ? 'enabled' : 'disabled'}!`, { type: 'success' });
        }
        if (gatewayAvailable) {
          reloadSoon();
        } else if (gatewayEnabled) {
          notify('LINSTOR-Gateway is not available. To ensure functionality, installing linstor-gateway is required.', {
            type: 'warning',
          });
        } else {
          notify('LINSTOR-Gateway configuration has been reset.', { type: 'success' });
        }
      } catch {
        notify('Cannot connect to LINSTOR-Gateway', { type: 'error' });
      }
    },
    [gatewayAvailable, saveKey],
  );

  const saveGrafanaConfig = useCallback(
    async (config: GrafanaConfigInput) => {
      try {
        await writeGrafanaConfig(config);
        await queryClient.invalidateQueries({ queryKey: GUI_SETTINGS_QUERY_KEY });
        notify('Grafana configuration saved', { type: 'success' });
        reloadSoon();
        return true;
      } catch (error) {
        logger.error('Failed to save Grafana config:', error);
        notify('Failed to save configuration', { type: 'error' });
        return false;
      }
    },
    [queryClient],
  );

  const setLogo = useCallback(async (payload: { logoSvg: string; logoUrl?: string }) => {
    await saveLogo(payload);
    reloadSoon();
  }, []);

  const disableCustomLogo = useCallback(async () => {
    await settingAPI.setProps({ customLogoEnabled: false });
    window.location.reload();
  }, []);

  const getMyLinbitStatus = useCallback(async () => {
    try {
      const res = await service.get('/api/frontend/v1/mylinbit/status');
      setEvalStatus({ evalMode: res.data.evalMode, isEvalContract: res.data.isEvalContract });
    } catch (error) {
      logger.debug(error);
    }
  }, []);

  const refreshAdmin = useCallback(() => setIsAdmin(computeIsAdmin(kvsRef.current)), []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      KVS,
      loaded: isFetched,
      logo: data?.logo ?? '',
      grafanaConfig: data?.grafanaConfig ?? null,
      mode,
      isAdmin,
      gatewayAvailable,
      checkingGateway,
      evalMode: evalStatus.evalMode,
      isEvalContract: evalStatus.isEvalContract,
      refresh,
      initSettingStore,
      setMode,
      refreshAdmin,
      saveKey,
      getGatewayStatus,
      setGatewayMode,
      saveGrafanaConfig,
      setLogo,
      disableCustomLogo,
      getMyLinbitStatus,
    }),
    [
      KVS,
      isFetched,
      data,
      mode,
      isAdmin,
      gatewayAvailable,
      checkingGateway,
      evalStatus,
      refresh,
      initSettingStore,
      refreshAdmin,
      saveKey,
      getGatewayStatus,
      setGatewayMode,
      saveGrafanaConfig,
      setLogo,
      disableCustomLogo,
      getMyLinbitStatus,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
