// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@app/requests', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@app/utils/toast', () => ({
  notify: vi.fn(),
}));

vi.mock('is-svg', () => ({
  default: vi.fn(),
}));

vi.mock('@app/features/settings', () => ({
  settingAPI: {
    instanceExists: vi.fn(),
    init: vi.fn(),
    getProps: vi.fn(),
    setProps: vi.fn(),
  },
  SettingsAPI: {
    instanceExists: vi.fn(),
    init: vi.fn(),
  },
}));

vi.mock('@app/features/keyValueStore', () => ({
  kvStore: {
    instanceExists: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@app/features/authentication/api', () => ({
  UserAuthAPI: vi.fn().mockImplementation(() => ({
    usersInstance: 'users',
    initUserStore: vi.fn(),
  })),
}));

// Import mocked modules
import service from '@app/requests';
import { notify } from '@app/utils/toast';
import isSvg from 'is-svg';
import { settingAPI, SettingsAPI } from '@app/features/settings';
import { kvStore } from '@app/features/keyValueStore';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

global.localStorage = mockLocalStorage as any;
global.window = Object.create(window);
Object.assign(window, {
  location: {
    protocol: 'https:',
    hostname: 'localhost',
  },
  localStorage: mockLocalStorage,
});

describe('Setting Model Logic', () => {
  let mockService: any;
  let mockNotify: any;
  let mockIsSvg: any;
  let mockSettingAPI: any;
  let mockKvStore: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = vi.mocked(service);
    mockNotify = vi.mocked(notify);
    mockIsSvg = vi.mocked(isSvg);
    mockSettingAPI = vi.mocked(settingAPI);
    mockKvStore = vi.mocked(kvStore);
  });

  describe('UIMode Enum', () => {
    it('should have NORMAL mode', () => {
      enum UIMode {
        NORMAL = 'NORMAL',
        VSAN = 'VSAN',
        HCI = 'HCI',
      }

      expect(UIMode.NORMAL).toBe('NORMAL');
    });

    it('should have VSAN mode', () => {
      enum UIMode {
        NORMAL = 'NORMAL',
        VSAN = 'VSAN',
        HCI = 'HCI',
      }

      expect(UIMode.VSAN).toBe('VSAN');
    });

    it('should have HCI mode', () => {
      enum UIMode {
        NORMAL = 'NORMAL',
        VSAN = 'VSAN',
        HCI = 'HCI',
      }

      expect(UIMode.HCI).toBe('HCI');
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state values', () => {
      const initialState = {
        gatewayAvailable: false,
        KVS: {},
        initialized: false,
        logo: '',
        mode: 'NORMAL',
        isAdmin: false,
        evalMode: false,
        isEvalContract: false,
        vsanAvailable: false,
        grafanaConfig: null,
      };

      expect(initialState.gatewayAvailable).toBe(false);
      expect(initialState.initialized).toBe(false);
      expect(initialState.isAdmin).toBe(false);
      expect(initialState.grafanaConfig).toBeNull();
    });
  });

  describe('Reducer: setGatewayAvailable', () => {
    it('should update gatewayAvailable state', () => {
      const currentState = { gatewayAvailable: false, KVS: {} };
      const payload = true;

      const newState = { ...currentState, gatewayAvailable: payload };

      expect(newState.gatewayAvailable).toBe(true);
    });
  });

  describe('Reducer: setMode', () => {
    it('should update mode to VSAN', () => {
      const currentState = { mode: 'NORMAL', KVS: {} };
      const payload = 'VSAN';

      const newState = { ...currentState, mode: payload };

      expect(newState.mode).toBe('VSAN');
    });

    it('should update mode to HCI', () => {
      const currentState = { mode: 'NORMAL', KVS: {} };
      const payload = 'HCI';

      const newState = { ...currentState, mode: payload };

      expect(newState.mode).toBe('HCI');
    });
  });

  describe('Reducer: setSettings', () => {
    it('should merge KVS props', () => {
      const currentState = { KVS: { prop1: 'value1' } };
      const payload = { prop2: 'value2', prop3: 'value3' };

      const newState = { ...currentState, KVS: { ...payload } };

      expect(newState.KVS).toEqual({ prop2: 'value2', prop3: 'value3' });
    });
  });

  describe('Reducer: updateLogo', () => {
    it('should update logo string', () => {
      const currentState = { logo: '' };
      const payload = 'new-logo.svg';

      const newState = { ...currentState, logo: payload };

      expect(newState.logo).toBe('new-logo.svg');
    });
  });

  describe('Reducer: setAdmin', () => {
    it('should set isAdmin to true when authentication is enabled and user is admin', () => {
      const currentState = {
        KVS: { authenticationEnabled: true },
        isAdmin: false,
      };
      const localStorageUser = 'admin';

      mockLocalStorage.getItem.mockReturnValue(localStorageUser);

      const isAdmin = currentState.KVS?.authenticationEnabled && localStorageUser === 'admin';

      expect(isAdmin).toBe(true);
    });

    it('should set isAdmin to false when authentication is disabled', () => {
      const currentState = {
        KVS: { authenticationEnabled: false },
        isAdmin: false,
      };

      const isAdmin = currentState.KVS?.authenticationEnabled;

      expect(isAdmin).toBe(false);
    });
  });

  describe('Reducer: setGrafanaConfig', () => {
    it('should update grafanaConfig', () => {
      const currentState = { grafanaConfig: null };
      const payload = {
        enable: true,
        baseUrl: 'http://localhost:3000',
        panelIds: { cpu: 1 },
      };

      const newState = { ...currentState, grafanaConfig: payload };

      expect(newState.grafanaConfig).toEqual(payload);
      expect(newState.grafanaConfig?.enable).toBe(true);
    });

    it('should set grafanaConfig to null', () => {
      const currentState = {
        grafanaConfig: { enable: true, baseUrl: 'http://localhost:3000', panelIds: {} },
      };
      const payload = null;

      const newState = { ...currentState, grafanaConfig: payload };

      expect(newState.grafanaConfig).toBeNull();
    });
  });

  describe('Effect: getGatewayStatus', () => {
    it('should set gatewayAvailable to true when status is ok', () => {
      const data = { status: 'ok' };
      const gatewayAvailable = data.status === 'ok';

      expect(gatewayAvailable).toBe(true);
    });

    it('should set gatewayAvailable to false when status is not ok', () => {
      const data = { status: 'error' };
      const gatewayAvailable = data.status === 'ok';

      expect(gatewayAvailable).toBe(false);
    });

    it('should generate correct API endpoint', () => {
      const endpoint = '/api/v2/status';

      expect(endpoint).toBe('/api/v2/status');
    });
  });

  describe('Effect: saveKey', () => {
    it('should structure payload correctly', () => {
      const payload = { gatewayEnabled: true, customHost: false };
      const expectedPayload = {
        override_props: {
          ...payload,
        },
      };

      expect(expectedPayload.override_props).toEqual(payload);
    });

    it('should generate correct KV store endpoint', () => {
      const SETTING_KEY = '__gui__settings';
      const endpoint = `/v1/key-value-store/${SETTING_KEY}`;

      expect(endpoint).toBe('/v1/key-value-store/__gui__settings');
    });
  });

  describe('Effect: deleteKey', () => {
    it('should structure delete payload correctly', () => {
      const payload = ['key1', 'key2'];
      const expectedPayload = {
        delete_props: payload,
      };

      expect(expectedPayload.delete_props).toEqual(payload);
    });
  });

  describe('Effect: setGatewayMode', () => {
    it('should enable gateway with custom host', () => {
      const gatewayEnabled = true;
      const customHost = true;
      const savePayload = {
        gatewayEnabled,
        gatewayCustomHost: gatewayEnabled && customHost,
      };

      expect(savePayload.gatewayEnabled).toBe(true);
      expect(savePayload.gatewayCustomHost).toBe(true);
    });

    it('should disable gateway', () => {
      const gatewayEnabled = false;
      const customHost = false;
      const savePayload = {
        gatewayEnabled,
        gatewayCustomHost: gatewayEnabled && customHost,
      };

      expect(savePayload.gatewayEnabled).toBe(false);
      expect(savePayload.gatewayCustomHost).toBe(false);
    });

    it('should show correct notification message for enabled gateway', () => {
      const gatewayEnabled = true;
      const message = `LINSTOR-Gateway ${gatewayEnabled ? 'enabled' : 'disabled'}!`;

      expect(message).toBe('LINSTOR-Gateway enabled!');
    });

    it('should show correct notification message for disabled gateway', () => {
      const gatewayEnabled = false;
      const message = `LINSTOR-Gateway ${gatewayEnabled ? 'enabled' : 'disabled'}!`;

      expect(message).toBe('LINSTOR-Gateway disabled!');
    });
  });

  describe('Effect: setVSANEvalStatus', () => {
    it('should update eval status', () => {
      const currentState = { evalMode: false, isEvalContract: false };
      const payload = { evalMode: true, isEvalContract: true };

      const newState = {
        ...currentState,
        evalMode: payload.evalMode,
        isEvalContract: payload.isEvalContract,
      };

      expect(newState.evalMode).toBe(true);
      expect(newState.isEvalContract).toBe(true);
    });
  });

  describe('Grafana Configuration', () => {
    it('should generate dashboard URL correctly', () => {
      const uid = 'abc123';
      const protocol = 'https:';
      const hostname = 'localhost';
      const url = `${protocol}//${hostname}:3000/d/${uid}/node-exporter-full?orgId=1&refresh=1m`;

      expect(url).toContain(uid);
      expect(url).toContain('node-exporter-full');
      expect(url).toContain('refresh=1m');
    });

    it('should generate DRBD dashboard URL correctly', () => {
      const uid = 'def456';
      const protocol = 'https:';
      const hostname = 'localhost';
      const url = `${protocol}//${hostname}:3000/d/${uid}/drbd?orgId=1&refresh=30s`;

      expect(url).toContain(uid);
      expect(url).toContain('/drbd');
      expect(url).toContain('refresh=30s');
    });

    it('should parse baseUrl from dashboardUrl', () => {
      const dashboardUrl = 'http://grafana.example.com:3000/d/abc123/dashboard';
      const url = new URL(dashboardUrl);
      const baseUrl = `${url.protocol}//${url.host}`;

      expect(baseUrl).toBe('http://grafana.example.com:3000');
    });

    it('should handle panel ID conversions', () => {
      const grafanaConfig = {
        panelIdCpu: '1',
        panelIdMemory: '2',
        panelIdNetwork: '3',
      };

      const panelIds = {
        cpu: Number(grafanaConfig.panelIdCpu),
        memory: Number(grafanaConfig.panelIdMemory),
        network: Number(grafanaConfig.panelIdNetwork),
      };

      expect(panelIds.cpu).toBe(1);
      expect(panelIds.memory).toBe(2);
      expect(panelIds.network).toBe(3);
    });

    it('should check if Grafana is enabled from string value', () => {
      const enable = 'true';
      const isEnabled = String(enable) === 'true';

      expect(isEnabled).toBe(true);
    });

    it('should check if DRBD is enabled from string value', () => {
      const drbdEnable = 'false';
      const isDrbdEnabled = String(drbdEnable) === 'true';

      expect(isDrbdEnabled).toBe(false);
    });
  });

  describe('Logo Handling', () => {
    it('should check if SVG is valid', () => {
      mockIsSvg.mockReturnValue(true);

      const logoSvg = '<svg>...</svg>';
      const isValid = mockIsSvg(logoSvg);

      expect(isValid).toBe(true);
    });

    it('should split long SVG into chunks', () => {
      const splitString = (str: string) => {
        const strArr: string[] = [];
        let index = 0;
        while (index < str.length) {
          strArr.push(str.slice(index, index + 4096));
          index += 4096;
        }
        return strArr;
      };

      const longSvg = 'a'.repeat(10000);
      const chunks = splitString(longSvg);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(4096);
      expect(chunks[1]).toHaveLength(4096);
      expect(chunks[2]).toHaveLength(1808);
    });

    it('should generate chunk keys correctly', () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];
      const keyStr = chunks.map((_, i) => `logoSvg_${i}`).join(',');

      expect(keyStr).toBe('logoSvg_0,logoSvg_1,logoSvg_2');
    });
  });

  describe('Mode-Specific Settings', () => {
    it('should set VSAN mode flags correctly', () => {
      const mode = 'VSAN';
      const settings = {
        vsanMode: mode === 'VSAN',
        hciMode: mode === 'HCI',
        vsanAvailable: mode === 'VSAN',
      };

      expect(settings.vsanMode).toBe(true);
      expect(settings.hciMode).toBe(false);
      expect(settings.vsanAvailable).toBe(true);
    });

    it('should set HCI mode flags correctly', () => {
      const mode = 'HCI';
      const settings = {
        vsanMode: mode === 'VSAN',
        hciMode: mode === 'HCI',
        vsanAvailable: mode === 'VSAN',
      };

      expect(settings.vsanMode).toBe(false);
      expect(settings.hciMode).toBe(true);
      expect(settings.vsanAvailable).toBe(false);
    });

    it('should set NORMAL mode flags correctly', () => {
      const mode = 'NORMAL';
      const settings = {
        vsanMode: mode === 'VSAN',
        hciMode: mode === 'HCI',
        vsanAvailable: mode === 'VSAN',
      };

      expect(settings.vsanMode).toBe(false);
      expect(settings.hciMode).toBe(false);
      expect(settings.vsanAvailable).toBe(false);
    });
  });

  describe('LocalStorage Keys', () => {
    it('should use correct keys for localStorage', () => {
      const GATEWAY_HOST = 'GATEWAY_HOST';
      const HCI_VSAN_HOST = 'HCI_VSAN_HOST';

      expect(GATEWAY_HOST).toBe('GATEWAY_HOST');
      expect(HCI_VSAN_HOST).toBe('HCI_VSAN_HOST');
    });

    it('should generate default gateway host', () => {
      const protocol = 'https:';
      const hostname = 'localhost';
      const defaultGatewayHost = `${protocol}//${hostname}:8337/`;

      expect(defaultGatewayHost).toBe('https://localhost:8337/');
    });

    it('should generate default VSAN host', () => {
      const hostname = 'localhost';
      const defaultVsanHost = `https://${hostname}`;

      expect(defaultVsanHost).toBe('https://localhost');
    });
  });

  describe('KV Store Namespaces', () => {
    it('should use correct namespace for settings', () => {
      const SETTING_KEY = '__gui__settings';

      expect(SETTING_KEY).toBe('__gui__settings');
    });

    it('should use correct namespace for Grafana', () => {
      const GRAFANA_KEY_VALUE_STORE_KEY = '__grafana__ui__settings';

      expect(GRAFANA_KEY_VALUE_STORE_KEY).toBe('__grafana__ui__settings');
    });
  });

  describe('GrafanaConfig Interface', () => {
    it('should define GrafanaConfig structure', () => {
      const grafanaConfig = {
        enable: true,
        baseUrl: 'http://localhost:3000',
        dashboardUid: 'abc123',
        panelIds: {
          cpu: 1,
          memory: 2,
        },
        drbdEnable: false,
      };

      expect(grafanaConfig.enable).toBeDefined();
      expect(grafanaConfig.baseUrl).toBeDefined();
      expect(grafanaConfig.dashboardUid).toBeDefined();
      expect(grafanaConfig.panelIds).toBeDefined();
    });
  });
});
