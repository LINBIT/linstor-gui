// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// The loaders and writers against mocked axios, settings api and key-value store.

const kvWrite = vi.hoisted(() => vi.fn());
vi.mock('@app/features/keyValueStore/api', () => ({ createOrModifyKVInstance: kvWrite }));

const settingsApi = vi.hoisted(() => ({ instanceExists: vi.fn(), getProps: vi.fn(), setProps: vi.fn() }));
vi.mock('@app/features/settings/SettingsAPI', () => ({
  SettingsAPI: { instanceExists: settingsApi.instanceExists },
  default: { getProps: settingsApi.getProps, setProps: settingsApi.setProps },
}));

const kv = vi.hoisted(() => ({ instanceExists: vi.fn(), get: vi.fn(), create: vi.fn() }));
vi.mock('@app/features/keyValueStore', () => ({ kvStore: kv }));

import { loadGuiSettings, modeOf, saveGrafanaConfig, saveLogo, saveSettingKeys } from '../guiSettings';
import { UIMode } from '../types';

const GRAFANA_NS = '__grafana__ui__settings';

describe('guiSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsApi.instanceExists.mockResolvedValue(true);
    settingsApi.getProps.mockResolvedValue({});
    kv.instanceExists.mockResolvedValue(false);
    kvWrite.mockResolvedValue({ data: [] });
  });

  it('modeOf reads the mutually exclusive mode flags', () => {
    expect(modeOf({ vsanMode: true })).toBe(UIMode.VSAN);
    expect(modeOf({ hciMode: true })).toBe(UIMode.HCI);
    expect(modeOf({})).toBe(UIMode.NORMAL);
  });

  describe('loadGuiSettings', () => {
    it('is null before the GUI was initialised', async () => {
      settingsApi.instanceExists.mockResolvedValue(false);
      expect(await loadGuiSettings()).toBeNull();
      expect(settingsApi.getProps).not.toHaveBeenCalled();
    });

    it('returns the props, no logo and no Grafana config by default', async () => {
      settingsApi.getProps.mockResolvedValue({ gatewayEnabled: true });
      expect(await loadGuiSettings()).toEqual({ KVS: { gatewayEnabled: true }, logo: '', grafanaConfig: null });
      expect(kv.get).not.toHaveBeenCalled();
    });

    it('rebuilds a custom logo from its chunks, or takes the URL', async () => {
      settingsApi.getProps.mockResolvedValue({ customLogoEnabled: true });
      kv.get.mockResolvedValue({
        props: { logoStr: 'logoSvg_0,logoSvg_1', logoSvg_0: '<svg>', logoSvg_1: '</svg>', logoUrl: '' },
      });
      expect((await loadGuiSettings())?.logo).toBe('<svg></svg>');
      expect(kv.get).toHaveBeenCalledWith('logo');

      kv.get.mockResolvedValue({ props: { logoStr: '', logoUrl: 'https://cdn/logo.png' } });
      expect((await loadGuiSettings())?.logo).toBe('https://cdn/logo.png');
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
      const loaded = await loadGuiSettings();

      expect(kvWrite).toHaveBeenCalledWith(GRAFANA_NS, {
        override_props: {
          dashboardUrl: 'http://localhost:3000/d/node-uid/node-exporter-full?orgId=1&refresh=1m',
          drbdUrl: 'http://localhost:3000/d/drbd-uid/drbd?orgId=1&refresh=30s',
        },
      });
      expect(loaded?.grafanaConfig).toMatchObject({
        enable: true,
        baseUrl: 'http://localhost:3000',
        dashboardUid: 'node-uid',
        panelIds: { cpu: 3, memory: 4 },
        drbdEnable: true,
        drbdWriteRatePanelId: 28,
        drbdReadRatePanelId: 29,
      });
    });

    it('keeps stored URLs and does not write them back', async () => {
      kv.instanceExists.mockResolvedValue(true);
      kv.get.mockResolvedValue({ props: { enable: 'true', dashboardUrl: 'https://grafana.example/d/x' } });
      const loaded = await loadGuiSettings();
      expect(kvWrite).not.toHaveBeenCalled();
      expect(loaded?.grafanaConfig?.baseUrl).toBe('https://grafana.example');
    });

    it('a failing logo does not lose the props that decide login, mode and gateway', async () => {
      settingsApi.getProps.mockResolvedValue({ customLogoEnabled: true, authenticationEnabled: true });
      kv.get.mockRejectedValue(new Error('logo instance gone'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const loaded = await loadGuiSettings();
      expect(loaded?.KVS).toEqual({ customLogoEnabled: true, authenticationEnabled: true });
      expect(loaded?.logo).toBe('');
    });

    it('a disabled Grafana config, or a failing one, resolves to null without failing the load', async () => {
      kv.instanceExists.mockResolvedValue(true);
      kv.get.mockResolvedValue({ props: { enable: 'false' } });
      expect((await loadGuiSettings())?.grafanaConfig).toBeNull();

      kv.instanceExists.mockRejectedValue(new Error('kv down'));
      const loaded = await loadGuiSettings();
      expect(loaded?.grafanaConfig).toBeNull();
      expect(loaded?.KVS).toEqual({});
    });
  });

  it('saveSettingKeys writes to the settings namespace, as the strings the store keeps', async () => {
    await saveSettingKeys({ gatewayEnabled: true, retries: 3 });
    expect(kvWrite).toHaveBeenCalledWith('__gui__settings', {
      override_props: { gatewayEnabled: 'true', retries: '3' },
    });
  });

  it('saveSettingKeys fails when the controller refuses the write', async () => {
    kvWrite.mockResolvedValue({
      error: [{ ret_code: -1, message: 'read only' }],
      response: { ok: false, status: 500 },
    });
    await expect(saveSettingKeys({ gatewayEnabled: true })).rejects.toThrow('read only');
  });

  describe('saveGrafanaConfig', () => {
    const config = {
      enable: true,
      dashboardUrl: 'https://grafana.example/d/x',
      panelIds: { cpu: 3 },
      drbdEnable: false,
    };

    it('creates the namespace on first save, with string values and defaults', async () => {
      await saveGrafanaConfig(config);
      expect(kv.create).toHaveBeenCalledWith(GRAFANA_NS, {
        override_props: expect.objectContaining({
          enable: 'true',
          dashboardUrl: 'https://grafana.example/d/x',
          panelIdCpu: '3',
          drbdEnable: 'false',
          drbdWriteRatePanelId: '28',
          drbdReadRatePanelId: '29',
        }),
      });
      // Unset panel IDs are left out rather than stored as "undefined".
      expect(kv.create.mock.calls[0][1].override_props).not.toHaveProperty('panelIdMemory');
    });

    it('updates an existing namespace in place', async () => {
      kv.instanceExists.mockResolvedValue(true);
      await saveGrafanaConfig(config);
      expect(kv.create).not.toHaveBeenCalled();
      expect(kvWrite).toHaveBeenCalledWith(GRAFANA_NS, {
        override_props: expect.objectContaining({ enable: 'true' }),
      });
    });
  });

  describe('saveLogo', () => {
    it('stores an SVG in 4 KiB chunks with an index of their keys, then enables the logo', async () => {
      const svg = '<svg>' + 'x'.repeat(5000) + '</svg>';
      await saveLogo({ logoSvg: svg });
      const props = kv.create.mock.calls[0][1].override_props as Record<string, string>;
      expect(kv.create.mock.calls[0][0]).toBe('logo');
      expect(props.logoStr).toBe('logoSvg_0,logoSvg_1');
      expect(props.logoSvg_0 + props.logoSvg_1).toBe(svg);
      expect(props.logoSvg_0).toHaveLength(4096);
      expect(settingsApi.setProps).toHaveBeenCalledWith({ customLogoEnabled: true });
    });

    it('stores a URL as is and ignores anything that is not SVG', async () => {
      await saveLogo({ logoSvg: '', logoUrl: 'https://cdn/logo.png' });
      expect(kv.create).toHaveBeenLastCalledWith('logo', {
        override_props: { logoStr: '', logoUrl: 'https://cdn/logo.png' },
      });
      await saveLogo({ logoSvg: 'not svg' });
      expect(kv.create).toHaveBeenLastCalledWith('logo', { override_props: { logoStr: '', logoUrl: '' } });
    });
  });
});
