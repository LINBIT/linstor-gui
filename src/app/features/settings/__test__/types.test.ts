// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import type { SettingsProps } from '../types';

// Mock UIMode enum for testing
const UIMode = {
  GUI: 'GUI',
  HCI: 'HCI',
  VSAN: 'VSAN',
} as const;

type UIMode = (typeof UIMode)[keyof typeof UIMode];

describe('Settings Types', () => {
  describe('SettingsProps Interface', () => {
    it('should define all required settings properties', () => {
      // Create a valid SettingsProps object to test the type structure
      const validSettings: SettingsProps = {
        gatewayEnabled: true,
        dashboardEnabled: false,
        gatewayCustomHost: true,
        dashboardURL: 'https://dashboard.example.com',
        authenticationEnabled: false,
        customLogoEnabled: true,
        gatewayHost: 'gateway.local',
        hideDefaultCredential: false,
        mode: UIMode.GUI,
        vsanAvailable: true,
      };

      // Test that all properties are properly typed
      expect(typeof validSettings.gatewayEnabled).toBe('boolean');
      expect(typeof validSettings.dashboardEnabled).toBe('boolean');
      expect(typeof validSettings.gatewayCustomHost).toBe('boolean');
      expect(typeof validSettings.dashboardURL).toBe('string');
      expect(typeof validSettings.authenticationEnabled).toBe('boolean');
      expect(typeof validSettings.customLogoEnabled).toBe('boolean');
      expect(typeof validSettings.gatewayHost).toBe('string');
      expect(typeof validSettings.hideDefaultCredential).toBe('boolean');
      expect(typeof validSettings.vsanAvailable).toBe('boolean');

      // Mode should be a UIMode enum value
      expect(Object.values(UIMode)).toContain(validSettings.mode);
    });

    it('should allow optional properties to be undefined', () => {
      // Test that all properties are optional
      const minimalSettings: SettingsProps = {};

      expect(minimalSettings.gatewayEnabled).toBeUndefined();
      expect(minimalSettings.dashboardEnabled).toBeUndefined();
      expect(minimalSettings.gatewayCustomHost).toBeUndefined();
      expect(minimalSettings.dashboardURL).toBeUndefined();
      expect(minimalSettings.authenticationEnabled).toBeUndefined();
      expect(minimalSettings.customLogoEnabled).toBeUndefined();
      expect(minimalSettings.gatewayHost).toBeUndefined();
      expect(minimalSettings.hideDefaultCredential).toBeUndefined();
      expect(minimalSettings.mode).toBeUndefined();
      expect(minimalSettings.vsanAvailable).toBeUndefined();
    });

    it('should support partial settings objects', () => {
      const partialSettings: SettingsProps = {
        gatewayEnabled: true,
        dashboardURL: 'https://example.com',
      };

      expect(partialSettings.gatewayEnabled).toBe(true);
      expect(partialSettings.dashboardURL).toBe('https://example.com');
      expect(partialSettings.dashboardEnabled).toBeUndefined();
    });

    it('should work with different UIMode values', () => {
      const guiSettings: SettingsProps = {
        mode: UIMode.GUI,
      };

      const hciSettings: SettingsProps = {
        mode: UIMode.HCI,
      };

      const vsanSettings: SettingsProps = {
        mode: UIMode.VSAN,
      };

      expect(guiSettings.mode).toBe(UIMode.GUI);
      expect(hciSettings.mode).toBe(UIMode.HCI);
      expect(vsanSettings.mode).toBe(UIMode.VSAN);
    });

    it('should handle boolean properties correctly', () => {
      const booleanSettings: SettingsProps = {
        gatewayEnabled: false,
        dashboardEnabled: true,
        gatewayCustomHost: false,
        authenticationEnabled: true,
        customLogoEnabled: false,
        hideDefaultCredential: true,
        vsanAvailable: false,
      };

      // All boolean properties should be boolean type
      Object.entries(booleanSettings).forEach(([key, value]) => {
        if (key !== 'dashboardURL' && key !== 'gatewayHost' && key !== 'mode') {
          expect(typeof value).toBe('boolean');
        }
      });
    });

    it('should handle string properties correctly', () => {
      const stringSettings: SettingsProps = {
        dashboardURL: '',
        gatewayHost: 'localhost:8080',
      };

      expect(typeof stringSettings.dashboardURL).toBe('string');
      expect(typeof stringSettings.gatewayHost).toBe('string');
    });

    it('should support URL validation patterns', () => {
      const urlSettings: SettingsProps = {
        dashboardURL: 'https://valid-dashboard.example.com:8443/dashboard',
        gatewayHost: 'gateway.internal:9999',
      };

      // Test URL-like strings
      expect(urlSettings.dashboardURL).toMatch(/^https?:\/\//);
      expect(urlSettings.gatewayHost).toContain(':');
    });

    it('should handle empty string values', () => {
      const emptyStringSettings: SettingsProps = {
        dashboardURL: '',
        gatewayHost: '',
      };

      expect(emptyStringSettings.dashboardURL).toBe('');
      expect(emptyStringSettings.gatewayHost).toBe('');
    });

    it('should support realistic configuration scenarios', () => {
      // Enterprise setup
      const enterpriseSettings: SettingsProps = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        gatewayHost: 'linstor-gateway.company.com',
        dashboardEnabled: true,
        dashboardURL: 'https://dashboard.company.com',
        authenticationEnabled: true,
        customLogoEnabled: true,
        hideDefaultCredential: true,
        mode: UIMode.GUI,
        vsanAvailable: false,
      };

      expect(enterpriseSettings.gatewayEnabled).toBe(true);
      expect(enterpriseSettings.authenticationEnabled).toBe(true);
      expect(enterpriseSettings.mode).toBe(UIMode.GUI);

      // Development setup
      const devSettings: SettingsProps = {
        gatewayEnabled: false,
        dashboardEnabled: false,
        authenticationEnabled: false,
        customLogoEnabled: false,
        hideDefaultCredential: false,
        mode: UIMode.GUI,
      };

      expect(devSettings.gatewayEnabled).toBe(false);
      expect(devSettings.authenticationEnabled).toBe(false);

      // HCI setup
      const hciSettings: SettingsProps = {
        mode: UIMode.HCI,
        vsanAvailable: true,
        gatewayEnabled: true,
        dashboardEnabled: true,
      };

      expect(hciSettings.mode).toBe(UIMode.HCI);
      expect(hciSettings.vsanAvailable).toBe(true);
    });

    it('should maintain type safety for object spread operations', () => {
      const baseSettings: SettingsProps = {
        gatewayEnabled: false,
        dashboardEnabled: false,
      };

      const extendedSettings: SettingsProps = {
        ...baseSettings,
        gatewayEnabled: true,
        authenticationEnabled: true,
      };

      expect(extendedSettings.gatewayEnabled).toBe(true);
      expect(extendedSettings.dashboardEnabled).toBe(false);
      expect(extendedSettings.authenticationEnabled).toBe(true);
    });

    it('should work with Object.keys and Object.entries', () => {
      const settings: SettingsProps = {
        gatewayEnabled: true,
        dashboardURL: 'https://example.com',
        mode: UIMode.GUI,
      };

      const keys = Object.keys(settings);
      const entries = Object.entries(settings);

      expect(keys).toContain('gatewayEnabled');
      expect(keys).toContain('dashboardURL');
      expect(keys).toContain('mode');

      expect(entries.length).toBe(3);
      expect(entries[0]).toEqual(['gatewayEnabled', true]);
    });

    it('should support conditional properties based on other properties', () => {
      // Gateway host should only be relevant when gateway is custom
      const conditionalSettings: SettingsProps = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        gatewayHost: 'custom-gateway.com',
      };

      if (conditionalSettings.gatewayEnabled && conditionalSettings.gatewayCustomHost) {
        expect(conditionalSettings.gatewayHost).toBeTruthy();
      }

      // Dashboard URL should only be relevant when dashboard is enabled
      const dashboardSettings: SettingsProps = {
        dashboardEnabled: true,
        dashboardURL: 'https://dashboard.example.com',
      };

      if (dashboardSettings.dashboardEnabled) {
        expect(dashboardSettings.dashboardURL).toBeTruthy();
      }
    });
  });

  describe('Type Compatibility', () => {
    it('should be compatible with Partial<SettingsProps>', () => {
      const partialUpdate: Partial<SettingsProps> = {
        gatewayEnabled: true,
      };

      const fullSettings: SettingsProps = {
        dashboardEnabled: false,
        ...partialUpdate,
      };

      expect(fullSettings.gatewayEnabled).toBe(true);
      expect(fullSettings.dashboardEnabled).toBe(false);
    });

    it('should work with Pick<SettingsProps>', () => {
      type GatewaySettings = Pick<SettingsProps, 'gatewayEnabled' | 'gatewayCustomHost' | 'gatewayHost'>;

      const gatewayConfig: GatewaySettings = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        gatewayHost: 'gateway.example.com',
      };

      expect(gatewayConfig.gatewayEnabled).toBe(true);
      expect(gatewayConfig.gatewayCustomHost).toBe(true);
      expect(gatewayConfig.gatewayHost).toBe('gateway.example.com');
    });

    it('should work with Omit<SettingsProps>', () => {
      type SettingsWithoutMode = Omit<SettingsProps, 'mode'>;

      const settingsWithoutMode: SettingsWithoutMode = {
        gatewayEnabled: true,
        dashboardEnabled: false,
      };

      expect(settingsWithoutMode.gatewayEnabled).toBe(true);
      expect(settingsWithoutMode.dashboardEnabled).toBe(false);
      // mode property should not exist
      expect('mode' in settingsWithoutMode).toBe(false);
    });
  });
});
