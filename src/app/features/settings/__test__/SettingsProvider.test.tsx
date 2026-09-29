// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The provider on a real QueryClient; axios, the settings api, the key-value
// store, the user api and the toast are replaced.

vi.mock('@app/requests', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@app/utils/toast', () => ({ notify: vi.fn() }));

const settingsApi = vi.hoisted(() => ({
  instanceExists: vi.fn(),
  init: vi.fn(),
  getProps: vi.fn(),
  setProps: vi.fn(),
}));
vi.mock('@app/features/settings/SettingsAPI', () => ({
  SettingsAPI: { instanceExists: settingsApi.instanceExists, init: settingsApi.init },
  default: { getProps: settingsApi.getProps, setProps: settingsApi.setProps },
}));

const kv = vi.hoisted(() => ({ instanceExists: vi.fn(), get: vi.fn(), create: vi.fn() }));
vi.mock('@app/features/keyValueStore', () => ({ kvStore: kv }));

const userApi = vi.hoisted(() => ({ initUserStore: vi.fn(), usersInstance: '__gui__users' }));
vi.mock('@app/features/authentication/api', () => ({ default: userApi }));

import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { SettingsProvider } from '../SettingsProvider';
import { useSettings, type SettingsContextValue } from '../useSettings';
import { UIMode } from '../types';

const reload = vi.fn();

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const current: { value?: SettingsContextValue } = {};
  const Probe = () => {
    current.value = useSettings();
    return null;
  };
  render(
    <QueryClientProvider client={client}>
      <SettingsProvider>
        <Probe />
      </SettingsProvider>
    </QueryClientProvider>,
  );
  const settings = () => current.value as SettingsContextValue;
  return { settings, loaded: () => waitFor(() => expect(settings().loaded).toBe(true)) };
};

describe('SettingsProvider', () => {
  beforeAll(() => {
    // jsdom cannot navigate; the actions that reload the page only need to ask for it.
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    settingsApi.instanceExists.mockResolvedValue(true);
    settingsApi.getProps.mockResolvedValue({});
    kv.instanceExists.mockResolvedValue(false);
    vi.mocked(service.get).mockResolvedValue({ data: {} } as never);
    vi.mocked(service.put).mockResolvedValue({ status: 200 } as never);
  });

  it('refuses to work outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useSettings())).toThrow('useSettings must be used within a SettingsProvider');
  });

  it('derives the mode and the gateway host from the props, then probes the gateway', async () => {
    vi.mocked(service.get).mockResolvedValue({ data: { status: 'ok' } } as never);
    settingsApi.getProps.mockResolvedValue({ vsanMode: true, gatewayEnabled: true, gatewayHost: 'http://gw:1' });
    const { settings, loaded } = setup();
    await loaded();

    await waitFor(() => expect(settings().mode).toBe(UIMode.VSAN));
    expect(localStorage.getItem('GATEWAY_HOST')).toBe('http://gw:1');
    // The probe runs after the host is stored, never before.
    expect(service.get).toHaveBeenCalledWith('/api/v2/status');
    await waitFor(() => expect(settings().gatewayAvailable).toBe(true));
    // VSAN/HCI talk to the appliance API on this host unless told otherwise.
    expect(localStorage.getItem('HCI_VSAN_HOST')).toBe('https://localhost');

    settingsApi.getProps.mockResolvedValue({ gatewayEnabled: true, gatewayHost: '' });
    await act(() => settings().refresh());
    await waitFor(() => expect(settings().mode).toBe(UIMode.NORMAL));
    expect(localStorage.getItem('GATEWAY_HOST')).toBe('http://localhost:8337/');

    settingsApi.getProps.mockResolvedValue({ gatewayEnabled: false });
    await act(() => settings().refresh());
    await waitFor(() => expect(localStorage.getItem('GATEWAY_HOST')).toBeNull());
    expect(settings().gatewayAvailable).toBe(false);
  });

  it('isAdmin needs authentication on and the admin as the stored user, and follows refreshAdmin', async () => {
    settingsApi.getProps.mockResolvedValue({ authenticationEnabled: true });
    const { settings, loaded } = setup();
    await loaded();
    expect(settings().isAdmin).toBe(false);

    localStorage.setItem('linstorname', 'admin');
    act(() => settings().refreshAdmin());
    expect(settings().isAdmin).toBe(true);

    settingsApi.getProps.mockResolvedValue({ authenticationEnabled: false });
    await act(() => settings().refresh());
    await waitFor(() => expect(settings().isAdmin).toBe(false));
  });

  it('exposes the logo and the Grafana config', async () => {
    settingsApi.getProps.mockResolvedValue({ customLogoEnabled: true });
    kv.get.mockResolvedValue({ props: { logoStr: '', logoUrl: 'https://cdn/logo.png' } });
    const { settings, loaded } = setup();
    await loaded();
    expect(settings().logo).toBe('https://cdn/logo.png');
    expect(settings().grafanaConfig).toBeNull();
  });

  describe('initSettingStore', () => {
    it('on an existing store writes the mode flags exclusively and reloads the settings', async () => {
      const { settings, loaded } = setup();
      await loaded();
      settingsApi.getProps.mockClear();
      await act(() => settings().initSettingStore(UIMode.HCI));
      expect(settingsApi.init).not.toHaveBeenCalled();
      expect(settingsApi.setProps).toHaveBeenCalledWith({ vsanMode: false, hciMode: true, vsanAvailable: false });
      expect(settingsApi.getProps).toHaveBeenCalled();
    });

    it('on a fresh install initialises the backend for the mode', async () => {
      settingsApi.instanceExists.mockResolvedValue(false);
      const { settings } = setup();
      await act(() => settings().initSettingStore(UIMode.VSAN));
      expect(settingsApi.init).toHaveBeenCalledWith(UIMode.VSAN);
      expect(settingsApi.setProps).toHaveBeenCalledWith({ vsanMode: true, hciMode: false, vsanAvailable: true });
    });

    it('creates the user store when authentication is on and it is missing', async () => {
      settingsApi.getProps.mockResolvedValue({ authenticationEnabled: true });
      const { settings, loaded } = setup();
      await loaded();
      await act(() => settings().initSettingStore(UIMode.NORMAL));
      expect(kv.instanceExists).toHaveBeenCalledWith('__gui__users');
      expect(userApi.initUserStore).toHaveBeenCalled();

      kv.instanceExists.mockResolvedValue(true);
      userApi.initUserStore.mockClear();
      await act(() => settings().initSettingStore(UIMode.NORMAL));
      expect(userApi.initUserStore).not.toHaveBeenCalled();
    });
  });

  describe('setGatewayMode', () => {
    it('enabling with a custom host saves both keys and warns when the gateway is unreachable', async () => {
      const { settings, loaded } = setup();
      await loaded();
      await act(() => settings().setGatewayMode({ gatewayEnabled: true, customHost: true, host: 'http://gw:2' }));
      expect(service.put).toHaveBeenCalledWith('/v1/key-value-store/__gui__settings', {
        override_props: { gatewayEnabled: true, gatewayCustomHost: true },
      });
      expect(service.put).toHaveBeenCalledWith('/v1/key-value-store/__gui__settings', {
        override_props: { gatewayHost: 'http://gw:2' },
      });
      expect(notify).toHaveBeenCalledWith(expect.stringContaining('not available'), { type: 'warning' });
      expect(reload).not.toHaveBeenCalled();
    });

    it('disabling clears the host and reports the reset', async () => {
      const { settings, loaded } = setup();
      await loaded();
      await act(() =>
        settings().setGatewayMode({ gatewayEnabled: false, customHost: false, host: '', showToast: true }),
      );
      expect(service.put).toHaveBeenCalledWith('/v1/key-value-store/__gui__settings', {
        override_props: { gatewayHost: '', gatewayCustomHost: false },
      });
      expect(notify).toHaveBeenCalledWith('LINSTOR-Gateway disabled!', { type: 'success' });
      expect(notify).toHaveBeenCalledWith('LINSTOR-Gateway configuration has been reset.', { type: 'success' });
    });

    it('a failed write is reported as a connection problem', async () => {
      vi.mocked(service.put).mockRejectedValue(new Error('down'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { settings, loaded } = setup();
      await loaded();
      await act(() => settings().setGatewayMode({ gatewayEnabled: true, customHost: false, host: '' }));
      expect(notify).toHaveBeenCalledWith('Cannot connect to LINSTOR-Gateway', { type: 'error' });
    });
  });

  it('getGatewayStatus stores a given host and flags the probe while it runs', async () => {
    let answer!: (v: unknown) => void;
    const { settings, loaded } = setup();
    await loaded();
    vi.mocked(service.get).mockReturnValue(new Promise((resolve) => (answer = resolve)) as never);
    let probe!: Promise<boolean>;
    act(() => {
      probe = settings().getGatewayStatus('http://gw:3');
    });
    expect(localStorage.getItem('GATEWAY_HOST')).toBe('http://gw:3');
    expect(settings().checkingGateway).toBe(true);
    await act(async () => {
      answer({ data: { status: 'ok' } });
      expect(await probe).toBe(true);
    });
    expect(settings().checkingGateway).toBe(false);
    expect(settings().gatewayAvailable).toBe(true);
  });

  it('overlapping probes keep checkingGateway on until the last ends; the latest probe decides', async () => {
    const answers: Array<(v: unknown) => void> = [];
    const { settings, loaded } = setup();
    await loaded();
    vi.mocked(service.get).mockImplementation(() => new Promise((resolve) => answers.push(resolve)) as never);
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = settings().getGatewayStatus('http://old:8337/');
      second = settings().getGatewayStatus('http://new:8337/');
    });
    // The newer probe answers first and succeeds; the older one fails later.
    await act(async () => {
      answers[1]({ data: { status: 'ok' } });
      await second;
    });
    expect(settings().checkingGateway).toBe(true);
    expect(settings().gatewayAvailable).toBe(true);
    await act(async () => {
      answers[0]({ data: { status: 'down' } });
      await first;
    });
    expect(settings().checkingGateway).toBe(false);
    expect(settings().gatewayAvailable).toBe(true);
  });

  it('saveKey refreshes the cached settings', async () => {
    const { settings, loaded } = setup();
    await loaded();
    settingsApi.getProps.mockResolvedValue({ gatewayEnabled: false, hciMode: true });
    await act(() => settings().saveKey({ hciMode: true }));
    await waitFor(() => expect(settings().mode).toBe(UIMode.HCI));
  });

  it('a failed load is tried once, not three more times', async () => {
    settingsApi.instanceExists.mockRejectedValue(new Error('controller down'));
    setup();
    await waitFor(() => expect(settingsApi.instanceExists).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(settingsApi.instanceExists).toHaveBeenCalledTimes(1);
  });

  it('getMyLinbitStatus records the eval flags and swallows failures', async () => {
    const { settings, loaded } = setup();
    await loaded();
    vi.mocked(service.get).mockResolvedValue({ data: { evalMode: true, isEvalContract: true } } as never);
    await act(() => settings().getMyLinbitStatus());
    expect(settings().evalMode).toBe(true);
    expect(settings().isEvalContract).toBe(true);

    vi.mocked(service.get).mockRejectedValue(new Error('offline'));
    await act(() => settings().getMyLinbitStatus());
    expect(settings().evalMode).toBe(true);
  });

  it('saveGrafanaConfig reports the outcome and returns whether it saved', async () => {
    const { settings, loaded } = setup();
    await loaded();
    let saved!: boolean;
    await act(async () => {
      saved = await settings().saveGrafanaConfig({ enable: true, dashboardUrl: 'https://g/d/x' });
    });
    expect(saved).toBe(true);
    expect(kv.create).toHaveBeenCalledWith('__grafana__ui__settings', expect.anything());
    expect(notify).toHaveBeenCalledWith('Grafana configuration saved', { type: 'success' });

    kv.instanceExists.mockRejectedValue(new Error('kv down'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => {
      saved = await settings().saveGrafanaConfig({ enable: false });
    });
    expect(saved).toBe(false);
    expect(notify).toHaveBeenCalledWith('Failed to save configuration', { type: 'error' });
  });

  it('disableCustomLogo turns the flag off and reloads', async () => {
    const { settings, loaded } = setup();
    await loaded();
    await act(() => settings().disableCustomLogo());
    expect(settingsApi.setProps).toHaveBeenCalledWith({ customLogoEnabled: false });
    expect(reload).toHaveBeenCalled();
  });
});
