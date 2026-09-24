// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init, type RematchDispatch, type RematchRootState } from '@rematch/core';
import type { RootModel } from '..';
import type { SettingsProps } from '@app/features/settings';

// The setting model on a real rematch store; the axios service, the toast,
// the settings api, the key-value store and the user api are replaced.

vi.mock('@app/requests', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@app/utils/toast', () => ({ notify: vi.fn() }));
vi.mock('is-svg', () => ({ default: (s: string) => s.trim().startsWith('<svg') }));

const settingsApi = vi.hoisted(() => ({
  instanceExists: vi.fn(),
  init: vi.fn(),
  getProps: vi.fn(),
  setProps: vi.fn(),
}));
vi.mock('@app/features/settings', () => ({
  SettingsAPI: { instanceExists: settingsApi.instanceExists, init: settingsApi.init },
  settingAPI: { getProps: settingsApi.getProps, setProps: settingsApi.setProps },
}));

const kv = vi.hoisted(() => ({ instanceExists: vi.fn(), get: vi.fn(), create: vi.fn() }));
vi.mock('@app/features/keyValueStore', () => ({ kvStore: kv }));

const userApi = vi.hoisted(() => ({ initUserStore: vi.fn() }));
vi.mock('@app/features/authentication/api', () => ({
  UserAuthAPI: class {
    usersInstance = '__gui__users';
    initUserStore = userApi.initUserStore;
  },
}));

import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { setting, UIMode } from '../setting';

const GRAFANA_NS = '__grafana__ui__settings';
const api = vi.mocked(service);

// The model is typed against the full RootModel; this store carries only
// the setting slice, so dispatch and state are re-typed by hand.
const makeStore = () => {
  const store = init({ models: { setting } as never });
  return {
    dispatch: store.dispatch as unknown as RematchDispatch<RootModel>,
    getState: () => store.getState() as unknown as RematchRootState<RootModel>,
  };
};
type Store = ReturnType<typeof makeStore>;

describe('setting model', () => {
  let store: Store;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Several effects schedule window.location.reload; keep it off the clock.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    store = makeStore();
    settingsApi.instanceExists.mockResolvedValue(true);
    settingsApi.getProps.mockResolvedValue({});
    settingsApi.setProps.mockResolvedValue(true);
    kv.instanceExists.mockResolvedValue(false);
    api.get.mockResolvedValue({ data: {} });
    api.put.mockResolvedValue({ status: 200 });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('setAdmin is true only with authentication on and the admin stored', () => {
    store.dispatch.setting.setSettings({ authenticationEnabled: true } as SettingsProps);
    localStorage.setItem('linstorname', 'bob');
    store.dispatch.setting.setAdmin();
    expect(store.getState().setting.isAdmin).toBe(false);
    localStorage.setItem('linstorname', 'admin');
    store.dispatch.setting.setAdmin();
    expect(store.getState().setting.isAdmin).toBe(true);
    store.dispatch.setting.setSettings({ authenticationEnabled: false } as SettingsProps);
    store.dispatch.setting.setAdmin();
    expect(store.getState().setting.isAdmin).toBeFalsy();
  });

  it('getGatewayStatus stores a custom host and reflects the gateway answer', async () => {
    api.get.mockResolvedValue({ data: { status: 'ok' } });
    await expect(store.dispatch.setting.getGatewayStatus('http://gw:8337')).resolves.toBe(true);
    expect(localStorage.getItem('GATEWAY_HOST')).toBe('http://gw:8337');
    expect(store.getState().setting.gatewayAvailable).toBe(true);

    api.get.mockRejectedValue(new Error('down'));
    await expect(store.dispatch.setting.getGatewayStatus()).resolves.toBe(false);
    expect(store.getState().setting.gatewayAvailable).toBe(false);
  });

  it('getMyLinbitStatus records the eval flags and swallows failures', async () => {
    api.get.mockResolvedValue({ data: { evalMode: true, isEvalContract: false } });
    await store.dispatch.setting.getMyLinbitStatus();
    expect(store.getState().setting).toMatchObject({ evalMode: true, isEvalContract: false });
    api.get.mockRejectedValue(new Error('offline'));
    await expect(store.dispatch.setting.getMyLinbitStatus()).resolves.toBeUndefined();
  });

  describe('initSettingStore', () => {
    it('on an existing store writes the mode flags exclusively and loads the settings', async () => {
      settingsApi.getProps.mockResolvedValue({ hciMode: true });
      await store.dispatch.setting.initSettingStore(UIMode.HCI);
      expect(settingsApi.setProps).toHaveBeenCalledWith({ vsanMode: false, hciMode: true, vsanAvailable: false });
      expect(settingsApi.init).not.toHaveBeenCalled();
      expect(store.getState().setting).toMatchObject({ mode: UIMode.HCI, initialized: true });
      expect(localStorage.getItem('HCI_VSAN_HOST')).toBe('https://localhost');
    });

    it('on a fresh install initialises the backend for the mode', async () => {
      settingsApi.instanceExists.mockResolvedValue(false);
      await store.dispatch.setting.initSettingStore(UIMode.VSAN);
      expect(settingsApi.init).toHaveBeenCalledWith(UIMode.VSAN);
      expect(settingsApi.setProps).toHaveBeenCalledWith({
        vsanMode: true,
        hciMode: true && false,
        vsanAvailable: true,
      });
      expect(store.getState().setting.initialized).toBe(false);
    });

    it('creates the user store when authentication is on and it is missing', async () => {
      settingsApi.getProps.mockResolvedValue({ authenticationEnabled: true });
      kv.instanceExists.mockResolvedValue(false);
      await store.dispatch.setting.initSettingStore(UIMode.NORMAL);
      expect(userApi.initUserStore).toHaveBeenCalled();

      vi.clearAllMocks();
      kv.instanceExists.mockResolvedValue(true);
      settingsApi.instanceExists.mockResolvedValue(true);
      settingsApi.getProps.mockResolvedValue({ authenticationEnabled: true });
      await store.dispatch.setting.initSettingStore(UIMode.NORMAL);
      expect(userApi.initUserStore).not.toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('does nothing when the settings namespace is missing', async () => {
      settingsApi.instanceExists.mockResolvedValue(false);
      await store.dispatch.setting.getSettings();
      expect(settingsApi.getProps).not.toHaveBeenCalled();
    });

    it('derives the mode and the gateway host from the props, then probes the gateway', async () => {
      vi.mocked(service.get).mockResolvedValue({ data: { status: 'ok' } } as never);
      settingsApi.getProps.mockResolvedValue({ vsanMode: true, gatewayEnabled: true, gatewayHost: 'http://gw:1' });
      await store.dispatch.setting.getSettings();
      expect(store.getState().setting.mode).toBe(UIMode.VSAN);
      expect(localStorage.getItem('GATEWAY_HOST')).toBe('http://gw:1');
      // The probe runs after the host is stored, never before.
      expect(service.get).toHaveBeenCalledWith('/api/v2/status');
      await vi.waitFor(() => expect(store.getState().setting.gatewayAvailable).toBe(true));

      settingsApi.getProps.mockResolvedValue({ gatewayEnabled: true, gatewayHost: '' });
      await store.dispatch.setting.getSettings();
      expect(store.getState().setting.mode).toBe(UIMode.NORMAL);
      expect(localStorage.getItem('GATEWAY_HOST')).toBe('http://localhost:8337/');

      settingsApi.getProps.mockResolvedValue({ gatewayEnabled: false });
      await store.dispatch.setting.getSettings();
      expect(localStorage.getItem('GATEWAY_HOST')).toBeNull();
      expect(store.getState().setting.gatewayAvailable).toBe(false);
    });

    it('rebuilds a custom logo from its chunks, or takes the URL', async () => {
      settingsApi.getProps.mockResolvedValue({ customLogoEnabled: true });
      kv.get.mockResolvedValue({
        props: { logoStr: 'logoSvg_0,logoSvg_1', logoSvg_0: '<svg>', logoSvg_1: '</svg>', logoUrl: '' },
      });
      await store.dispatch.setting.getSettings();
      expect(kv.get).toHaveBeenCalledWith('logo');
      expect(store.getState().setting.logo).toBe('<svg></svg>');

      kv.get.mockResolvedValue({ props: { logoStr: '', logoUrl: 'https://cdn/logo.png' } });
      await store.dispatch.setting.getSettings();
      expect(store.getState().setting.logo).toBe('https://cdn/logo.png');
    });

    it('loads an enabled Grafana config, generating and persisting missing URLs', async () => {
      kv.instanceExists.mockResolvedValue(true);
      kv.get.mockResolvedValue({
        props: {
          enable: 'true',
          dashboardUid: 'node-uid',
          panelIdCpu: '3',
          panelIdMemory: '4',
          drbdEnable: 'true',
          drbdUid: 'drbd-uid',
        },
      });
      await store.dispatch.setting.getSettings();

      expect(api.put).toHaveBeenCalledWith(`/v1/key-value-store/${GRAFANA_NS}`, {
        override_props: {
          dashboardUrl: 'http://localhost:3000/d/node-uid/node-exporter-full?orgId=1&refresh=1m',
          drbdUrl: 'http://localhost:3000/d/drbd-uid/drbd?orgId=1&refresh=30s',
        },
      });
      expect(store.getState().setting.grafanaConfig).toMatchObject({
        enable: true,
        baseUrl: 'http://localhost:3000',
        dashboardUid: 'node-uid',
        panelIds: { cpu: 3, memory: 4 },
        drbdEnable: true,
        drbdWriteRatePanelId: 28,
        drbdReadRatePanelId: 29,
      });
    });

    it('a disabled or absent Grafana config resolves to null', async () => {
      kv.instanceExists.mockResolvedValue(true);
      kv.get.mockResolvedValue({ props: { enable: 'false' } });
      await store.dispatch.setting.getSettings();
      expect(store.getState().setting.grafanaConfig).toBeNull();

      kv.instanceExists.mockResolvedValue(false);
      await store.dispatch.setting.getSettings();
      expect(store.getState().setting.grafanaConfig).toBeNull();
    });
  });

  it('saveKey and deleteKey write to the settings namespace', async () => {
    await store.dispatch.setting.saveKey({ needsPasswordChange: false });
    expect(api.put).toHaveBeenCalledWith('/v1/key-value-store/__gui__settings', {
      override_props: { needsPasswordChange: false },
    });
    await store.dispatch.setting.deleteKey(['logo']);
    expect(api.put).toHaveBeenLastCalledWith('/v1/key-value-store/__gui__settings', { delete_props: ['logo'] });
    api.put.mockRejectedValue(new Error('kv down'));
    await expect(store.dispatch.setting.saveKey({ a: 1 })).rejects.toThrow('kv down');
  });

  describe('setGatewayMode', () => {
    it('enabling with a custom host saves both keys and warns when the gateway is unreachable', async () => {
      await store.dispatch.setting.setGatewayMode({
        gatewayEnabled: true,
        customHost: true,
        host: 'http://gw:8337',
        showToast: true,
      });
      const writes = api.put.mock.calls.map(([, body]) => (body as { override_props: unknown }).override_props);
      expect(writes).toEqual([{ gatewayEnabled: true, gatewayCustomHost: true }, { gatewayHost: 'http://gw:8337' }]);
      expect(notify).toHaveBeenCalledWith('LINSTOR-Gateway enabled!', { type: 'success' });
      expect(notify).toHaveBeenCalledWith(expect.stringContaining('not available'), { type: 'warning' });
    });

    it('disabling clears the host and reports the reset', async () => {
      await store.dispatch.setting.setGatewayMode({ gatewayEnabled: false, customHost: false, host: '' });
      const writes = api.put.mock.calls.map(([, body]) => (body as { override_props: unknown }).override_props);
      expect(writes).toEqual([
        { gatewayEnabled: false, gatewayCustomHost: false },
        { gatewayHost: '', gatewayCustomHost: false },
      ]);
      expect(notify).toHaveBeenCalledWith('LINSTOR-Gateway configuration has been reset.', { type: 'success' });
    });

    it('a failed write is reported as a connection problem', async () => {
      api.put.mockRejectedValue(new Error('kv down'));
      await store.dispatch.setting.setGatewayMode({ gatewayEnabled: true, customHost: false, host: '' });
      expect(notify).toHaveBeenCalledWith('Cannot connect to LINSTOR-Gateway', { type: 'error' });
    });
  });

  describe('saveGrafanaConfig', () => {
    const config = {
      enable: true,
      dashboardUrl: 'http://grafana:3000/d/uid/node?orgId=1',
      dashboardUid: 'uid',
      panelIds: { cpu: 1, memory: 2 },
      drbdEnable: true,
      drbdUid: 'drbd',
    };

    it('creates the namespace on first save, updates it afterwards, and mirrors the config into state', async () => {
      kv.instanceExists.mockResolvedValue(false);
      await expect(store.dispatch.setting.saveGrafanaConfig(config)).resolves.toBe(true);
      // Key-value store values are strings, sent as such.
      expect(kv.create).toHaveBeenCalledWith(GRAFANA_NS, {
        override_props: expect.objectContaining({
          enable: 'true',
          dashboardUid: 'uid',
          panelIdCpu: '1',
          drbdWriteRatePanelId: '28',
        }),
      });
      // Panel IDs the form left unset are not sent at all.
      expect(kv.create.mock.calls[0][1].override_props).not.toHaveProperty('panelIdNetwork');
      expect(store.getState().setting.grafanaConfig).toMatchObject({
        enable: true,
        baseUrl: 'http://grafana:3000',
        panelIds: { cpu: 1, memory: 2 },
      });
      expect(notify).toHaveBeenCalledWith('Grafana configuration saved', { type: 'success' });

      kv.instanceExists.mockResolvedValue(true);
      await store.dispatch.setting.saveGrafanaConfig({ ...config, enable: false });
      expect(api.put).toHaveBeenCalledWith(`/v1/key-value-store/${GRAFANA_NS}`, {
        override_props: expect.objectContaining({ enable: 'false' }),
      });
      expect(store.getState().setting.grafanaConfig).toBeNull();
    });

    it('reports a failed save', async () => {
      kv.instanceExists.mockRejectedValue(new Error('kv down'));
      await expect(store.dispatch.setting.saveGrafanaConfig(config)).resolves.toBe(false);
      expect(notify).toHaveBeenCalledWith('Failed to save configuration', { type: 'error' });
    });
  });

  describe('setLogo', () => {
    it('stores an SVG in 4 KiB chunks with an index of their keys', async () => {
      const svg = '<svg>' + 'x'.repeat(5000) + '</svg>';
      await store.dispatch.setting.setLogo({ logoSvg: svg });
      const [, body] = kv.create.mock.calls[0];
      const props = (body as { override_props: Record<string, string> }).override_props;
      expect(props.logoStr).toBe('logoSvg_0,logoSvg_1');
      expect(props.logoSvg_0 + props.logoSvg_1).toBe(svg);
      expect(props.logoUrl).toBe('');
      expect(settingsApi.setProps).toHaveBeenCalledWith({ customLogoEnabled: true });
    });

    it('stores a URL as is and ignores anything that is not SVG', async () => {
      await store.dispatch.setting.setLogo({ logoSvg: '', logoUrl: 'https://cdn/logo.png' });
      expect(kv.create).toHaveBeenCalledWith('logo', {
        override_props: { logoStr: '', logoUrl: 'https://cdn/logo.png' },
      });
      await store.dispatch.setting.setLogo({ logoSvg: 'not svg' });
      expect(kv.create).toHaveBeenLastCalledWith('logo', { override_props: { logoStr: '', logoUrl: '' } });
    });
  });

  it('disableCustomLogo turns the flag off', async () => {
    await store.dispatch.setting.disableCustomLogo();
    expect(settingsApi.setProps).toHaveBeenCalledWith({ customLogoEnabled: false });
  });
});
