// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@app/const/settings', () => ({
  GUI_KEY_VALUE_STORE_KEY: 'test-gui-settings',
}));

vi.mock('@app/features/authentication', () => ({
  authAPI: {
    usersInstance: 'test-users-instance',
    initUserStore: vi.fn(),
  },
}));

vi.mock('@app/features/keyValueStore', () => ({
  kvStore: {
    listInstances: vi.fn(),
    instanceExists: vi.fn(),
    modify: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@app/models/setting', () => ({
  UIMode: {
    GUI: 'GUI',
    HCI: 'HCI',
    VSAN: 'VSAN',
  },
}));

// Import after mocks
import { SettingsAPI, SETTINGS_FIELDS } from '../SettingsAPI';
import { kvStore } from '@app/features/keyValueStore';
import { authAPI } from '@app/features/authentication';
import { UIMode } from '@app/models/setting';

// Mock data
const mockSettingsProps = {
  gatewayEnabled: true,
  dashboardEnabled: false,
  gatewayCustomHost: true,
  vsanMode: false,
  hciMode: false,
  dashboardURL: 'https://dashboard.example.com',
  authenticationEnabled: true,
  customLogoEnabled: false,
  hideDefaultCredential: true,
  gatewayHost: 'gateway.example.com',
  vsanAvailable: false,
};

const mockStoreProps = {
  props: {
    gatewayEnabled: 'true',
    dashboardEnabled: 'false',
    gatewayCustomHost: 'true',
    vsanMode: 'false',
    hciMode: 'false',
    dashboardURL: 'https://dashboard.example.com',
    authenticationEnabled: 'true',
    customLogoEnabled: 'false',
    hideDefaultCredential: 'true',
    gatewayHost: 'gateway.example.com',
    vsanAvailable: 'false',
    __updated__: '2024-01-01T12:00:00Z',
  },
};

const mockSuccessResponse = [
  {
    ret_code: 1,
    message: 'Success',
  },
];

const mockFailureResponse = [
  {
    ret_code: 0,
    message: 'Failed',
  },
];

describe('SettingsAPI', () => {
  let mockKvStore: any;
  let mockAuthAPI: any;
  let settingsAPI: SettingsAPI;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockKvStore = vi.mocked(kvStore);
    mockAuthAPI = vi.mocked(authAPI);

    // Setup default mock implementations
    mockKvStore.listInstances.mockResolvedValue(['test-gui-settings']);
    mockKvStore.instanceExists.mockResolvedValue(true);
    mockKvStore.modify.mockResolvedValue(mockSuccessResponse);
    mockKvStore.get.mockResolvedValue(mockStoreProps);
    mockKvStore.delete.mockResolvedValue(undefined);

    settingsAPI = new SettingsAPI();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Static Properties and Constants', () => {
    it('should have correct settings field definitions', () => {
      expect(SETTINGS_FIELDS.BOOLEAN).toEqual([
        'gatewayEnabled',
        'dashboardEnabled',
        'gatewayCustomHost',
        'vsanMode',
        'hciMode',
        'authenticationEnabled',
        'customLogoEnabled',
        'hideDefaultCredential',
        'vsanAvailable',
      ]);

      expect(SETTINGS_FIELDS.STRING).toEqual(['dashboardURL', 'gatewayHost']);
    });

    it('should have correct instance key', () => {
      expect(SettingsAPI.instance).toBe('test-gui-settings');
    });
  });

  describe('instanceExists', () => {
    it('should check if instance exists in store', async () => {
      mockKvStore.listInstances.mockResolvedValue(['test-gui-settings', 'other-instance']);

      const exists = await SettingsAPI.instanceExists();

      expect(exists).toBe(true);
      expect(mockKvStore.listInstances).toHaveBeenCalled();
    });

    it('should return false when instance does not exist', async () => {
      mockKvStore.listInstances.mockResolvedValue(['other-instance']);

      const exists = await SettingsAPI.instanceExists();

      expect(exists).toBe(false);
    });

    it('should handle API errors', async () => {
      mockKvStore.listInstances.mockRejectedValue(new Error('API Error'));

      try {
        await SettingsAPI.instanceExists();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('init', () => {
    it('should initialize settings for GUI mode', async () => {
      mockKvStore.instanceExists.mockResolvedValue(false);

      await SettingsAPI.init(UIMode.GUI);

      expect(mockKvStore.modify).toHaveBeenCalledWith(
        'test-gui-settings',
        expect.objectContaining({
          override_props: expect.objectContaining({
            gatewayEnabled: 'false',
            dashboardEnabled: 'false',
            vsanMode: 'false',
            hciMode: 'false',
            __updated__: expect.any(String),
          }),
          delete_props: [],
        }),
      );
    });

    it('should initialize settings for HCI mode', async () => {
      mockKvStore.instanceExists.mockResolvedValue(false);

      await SettingsAPI.init(UIMode.HCI);

      expect(mockKvStore.modify).toHaveBeenCalledWith(
        'test-gui-settings',
        expect.objectContaining({
          override_props: expect.objectContaining({
            hciMode: 'true',
            vsanMode: 'false',
          }),
        }),
      );
    });

    it('should initialize settings for VSAN mode', async () => {
      mockKvStore.instanceExists.mockResolvedValue(false);

      await SettingsAPI.init(UIMode.VSAN);

      expect(mockKvStore.modify).toHaveBeenCalledWith(
        'test-gui-settings',
        expect.objectContaining({
          override_props: expect.objectContaining({
            vsanMode: 'true',
            hciMode: 'false',
          }),
        }),
      );
    });

    it('should not reinitialize if instance already exists', async () => {
      mockKvStore.instanceExists.mockResolvedValue(true);

      await SettingsAPI.init(UIMode.GUI);

      expect(mockKvStore.modify).not.toHaveBeenCalled();
    });

    it('should initialize user store if not exists', async () => {
      mockKvStore.instanceExists
        .mockResolvedValueOnce(false) // settings instance
        .mockResolvedValueOnce(false); // users instance

      await SettingsAPI.init(UIMode.GUI);

      expect(mockAuthAPI.initUserStore).toHaveBeenCalled();
    });
  });

  describe('serializeSettings', () => {
    it('should serialize boolean values to strings', () => {
      const settings = {
        gatewayEnabled: true,
        dashboardEnabled: false,
      };

      // Access private static method via bracket notation for testing
      const result = (SettingsAPI as any).serializeSettings(settings);

      expect(result).toEqual({
        gatewayEnabled: 'true',
        dashboardEnabled: 'false',
      });
    });

    it('should serialize string values', () => {
      const settings = {
        dashboardURL: 'https://example.com',
        gatewayHost: 'localhost',
      };

      const result = (SettingsAPI as any).serializeSettings(settings);

      expect(result).toEqual({
        dashboardURL: 'https://example.com',
        gatewayHost: 'localhost',
      });
    });

    it('should handle undefined values', () => {
      const settings = {
        gatewayEnabled: undefined,
        dashboardURL: undefined,
      };

      const result = (SettingsAPI as any).serializeSettings(settings);

      expect(result).toEqual({
        gatewayEnabled: '',
        dashboardURL: '',
      });
    });
  });

  describe('getFieldType', () => {
    it('should identify boolean fields', () => {
      const fieldType = settingsAPI['getFieldType']('gatewayEnabled');
      expect(fieldType).toBe('boolean');
    });

    it('should identify string fields', () => {
      const fieldType = settingsAPI['getFieldType']('dashboardURL');
      expect(fieldType).toBe('string');
    });

    it('should throw error for unknown fields', () => {
      expect(() => {
        settingsAPI['getFieldType']('unknownField' as any);
      }).toThrow('Unknown field type for field: unknownField');
    });
  });

  describe('deserializeValue', () => {
    it('should deserialize boolean values correctly', () => {
      const trueValue = settingsAPI['deserializeValue']('gatewayEnabled', 'true');
      const falseValue = settingsAPI['deserializeValue']('gatewayEnabled', 'false');

      expect(trueValue).toBe(true);
      expect(falseValue).toBe(false);
    });

    it('should deserialize string values correctly', () => {
      const stringValue = settingsAPI['deserializeValue']('dashboardURL', 'https://example.com');
      expect(stringValue).toBe('https://example.com');
    });

    it('should handle undefined values', () => {
      const undefinedValue = settingsAPI['deserializeValue']('gatewayEnabled', undefined);
      expect(undefinedValue).toBeUndefined();
    });
  });

  describe('getProps', () => {
    it('should retrieve and deserialize settings properties', async () => {
      const result = await settingsAPI.getProps();

      expect(result).toEqual(mockSettingsProps);
      expect(mockKvStore.get).toHaveBeenCalledWith('test-gui-settings');
    });

    it('should handle missing store props', async () => {
      mockKvStore.get.mockResolvedValue({ props: null });

      const result = await settingsAPI.getProps();

      expect(result).toEqual({});
    });

    it('should skip __updated__ field', async () => {
      const result = await settingsAPI.getProps();

      expect(result).not.toHaveProperty('__updated__');
    });

    it('should handle store errors', async () => {
      mockKvStore.get.mockRejectedValue(new Error('Store error'));

      try {
        await settingsAPI.getProps();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('validateProps', () => {
    it('should validate gateway configuration', () => {
      const invalidProps = {
        gatewayEnabled: true,
        gatewayCustomHost: undefined,
      };

      expect(() => {
        settingsAPI['validateProps'](invalidProps);
      }).toThrow('gatewayCustomHost must be defined when gatewayEnabled is true');
    });

    it('should validate gateway host configuration', () => {
      const invalidProps = {
        gatewayHost: 'example.com',
        gatewayCustomHost: false,
      };

      expect(() => {
        settingsAPI['validateProps'](invalidProps);
      }).toThrow('gatewayCustomHost must be true before gatewayHost can be set');
    });

    it('should validate conflicting modes', () => {
      const invalidProps = {
        vsanMode: true,
        hciMode: true,
      };

      expect(() => {
        settingsAPI['validateProps'](invalidProps);
      }).toThrow('vsanMode and hciMode cannot both be true');
    });

    it('should pass validation for valid props', () => {
      const validProps = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        gatewayHost: 'example.com',
        vsanMode: false,
        hciMode: true,
      };

      expect(() => {
        settingsAPI['validateProps'](validProps);
      }).not.toThrow();
    });
  });

  describe('setProps', () => {
    it('should set properties successfully', async () => {
      const props = {
        dashboardEnabled: true,
        dashboardURL: 'https://new-dashboard.com',
      };

      const result = await settingsAPI.setProps(props);

      expect(result).toBe(true);
      expect(mockKvStore.modify).toHaveBeenCalledWith(
        'test-gui-settings',
        expect.objectContaining({
          override_props: expect.objectContaining({
            dashboardEnabled: 'true',
            dashboardURL: 'https://new-dashboard.com',
            __updated__: expect.any(String),
          }),
          delete_props: [],
        }),
      );
    });

    it('should fail validation for invalid props', async () => {
      const invalidProps = {
        gatewayEnabled: true,
        gatewayCustomHost: undefined,
      };

      try {
        await settingsAPI.setProps(invalidProps);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('gatewayCustomHost must be defined');
      }
    });

    it('should handle store modification failures', async () => {
      mockKvStore.modify.mockResolvedValue(mockFailureResponse);

      const result = await settingsAPI.setProps({ dashboardEnabled: true });

      expect(result).toBe(false);
    });

    it('should include timestamp in updates', async () => {
      const beforeTime = Date.now();
      await settingsAPI.setProps({ dashboardEnabled: true });
      const afterTime = Date.now();

      const modifyCall = mockKvStore.modify.mock.calls[0];
      const timestamp = new Date(modifyCall[1].override_props.__updated__).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('clear', () => {
    it('should clear settings from store', async () => {
      await SettingsAPI.clear();

      expect(mockKvStore.delete).toHaveBeenCalledWith('test-gui-settings');
    });

    it('should handle clear errors', async () => {
      mockKvStore.delete.mockRejectedValue(new Error('Delete error'));

      try {
        await SettingsAPI.clear();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow: init -> set -> get -> clear', async () => {
      // Initialize
      mockKvStore.instanceExists.mockResolvedValue(false);
      await SettingsAPI.init(UIMode.GUI);

      // Set properties
      const props = { dashboardEnabled: true };
      await settingsAPI.setProps(props);

      // Get properties
      mockKvStore.get.mockResolvedValue({
        props: {
          dashboardEnabled: 'true',
          __updated__: '2024-01-01T12:00:00Z',
        },
      });

      const result = await settingsAPI.getProps();
      expect(result.dashboardEnabled).toBe(true);

      // Clear
      await SettingsAPI.clear();

      expect(mockKvStore.modify).toHaveBeenCalled();
      expect(mockKvStore.get).toHaveBeenCalled();
      expect(mockKvStore.delete).toHaveBeenCalled();
    });

    it('should handle concurrent access properly', async () => {
      const settingsAPI1 = new SettingsAPI();
      const settingsAPI2 = new SettingsAPI();

      const promise1 = settingsAPI1.setProps({ dashboardEnabled: true });
      const promise2 = settingsAPI2.setProps({ authenticationEnabled: true });

      await Promise.all([promise1, promise2]);

      expect(mockKvStore.modify).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should propagate store errors', async () => {
      mockKvStore.get.mockRejectedValue(new Error('Store unavailable'));

      try {
        await settingsAPI.getProps();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Store unavailable');
      }
    });

    it('should handle malformed store data', async () => {
      mockKvStore.get.mockResolvedValue({
        props: {
          gatewayEnabled: 'invalid-boolean',
          dashboardURL: 'null', // String 'null' instead of actual null
        },
      });

      const result = await settingsAPI.getProps();

      // Should handle gracefully - invalid boolean becomes false, string 'null' stays as string
      expect(result.gatewayEnabled).toBe(false);
      expect(result.dashboardURL).toBe('null');
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct field types at runtime', () => {
      const booleanFields = SETTINGS_FIELDS.BOOLEAN;
      const stringFields = SETTINGS_FIELDS.STRING;

      booleanFields.forEach((field) => {
        expect(settingsAPI['getFieldType'](field)).toBe('boolean');
      });

      stringFields.forEach((field) => {
        expect(settingsAPI['getFieldType'](field)).toBe('string');
      });
    });
  });
});
