// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import type { SettingsProps } from '../types';

describe('Settings Types', () => {
  describe('SettingsProps Interface', () => {
    it('should define all required settings properties', () => {
      // Create a valid SettingsProps object to test the type structure
      const validSettings: SettingsProps = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        authenticationEnabled: false,
        customLogoEnabled: true,
        gatewayHost: 'gateway.local',
        hideDefaultCredential: false,
        vsanMode: false,
        hciMode: false,
        vsanAvailable: true,
      };

      // Test that all properties are properly typed
      expect(typeof validSettings.gatewayEnabled).toBe('boolean');
      expect(typeof validSettings.gatewayCustomHost).toBe('boolean');
      expect(typeof validSettings.authenticationEnabled).toBe('boolean');
      expect(typeof validSettings.customLogoEnabled).toBe('boolean');
      expect(typeof validSettings.gatewayHost).toBe('string');
      expect(typeof validSettings.hideDefaultCredential).toBe('boolean');
      expect(typeof validSettings.vsanMode).toBe('boolean');
      expect(typeof validSettings.hciMode).toBe('boolean');
      expect(typeof validSettings.vsanAvailable).toBe('boolean');
    });

    it('should allow optional properties to be undefined', () => {
      // Test that Partial<SettingsProps> works for optional updates
      const partialSettings: Partial<SettingsProps> = {};

      expect(partialSettings.gatewayEnabled).toBeUndefined();
      expect(partialSettings.gatewayCustomHost).toBeUndefined();
      expect(partialSettings.authenticationEnabled).toBeUndefined();
      expect(partialSettings.customLogoEnabled).toBeUndefined();
      expect(partialSettings.gatewayHost).toBeUndefined();
      expect(partialSettings.hideDefaultCredential).toBeUndefined();
      expect(partialSettings.vsanMode).toBeUndefined();
      expect(partialSettings.hciMode).toBeUndefined();
      expect(partialSettings.vsanAvailable).toBeUndefined();
    });

    it('should support partial settings objects', () => {
      const partialSettings: Partial<SettingsProps> = {
        gatewayEnabled: true,
        gatewayHost: 'https://example.com',
      };

      expect(partialSettings.gatewayEnabled).toBe(true);
      expect(partialSettings.gatewayHost).toBe('https://example.com');
      expect(partialSettings.authenticationEnabled).toBeUndefined();
    });

    it('should work with different UIMode values', () => {
      // vsanMode and hciMode are boolean fields in SettingsProps
      const vsanSettings: Partial<SettingsProps> = {
        vsanMode: true,
        hciMode: false,
      };

      const hciSettings: Partial<SettingsProps> = {
        vsanMode: false,
        hciMode: true,
      };

      const normalSettings: Partial<SettingsProps> = {
        vsanMode: false,
        hciMode: false,
      };

      expect(vsanSettings.vsanMode).toBe(true);
      expect(hciSettings.hciMode).toBe(true);
      expect(normalSettings.vsanMode).toBe(false);
      expect(normalSettings.hciMode).toBe(false);
    });

    it('should handle boolean properties correctly', () => {
      const booleanSettings: Partial<SettingsProps> = {
        gatewayEnabled: false,
        gatewayCustomHost: false,
        authenticationEnabled: true,
        customLogoEnabled: false,
        hideDefaultCredential: true,
        vsanMode: false,
        hciMode: false,
        vsanAvailable: false,
      };

      // All boolean properties should be boolean type
      Object.entries(booleanSettings).forEach(([key, value]) => {
        if (key !== 'gatewayHost') {
          expect(typeof value).toBe('boolean');
        }
      });
    });

    it('should handle string properties correctly', () => {
      const stringSettings: Partial<SettingsProps> = {
        gatewayHost: 'localhost:8080',
      };

      expect(typeof stringSettings.gatewayHost).toBe('string');
    });

    it('should support URL validation patterns', () => {
      const urlSettings: Partial<SettingsProps> = {
        gatewayHost: 'gateway.internal:9999',
      };

      // Test URL-like strings
      expect(urlSettings.gatewayHost).toContain(':');
    });

    it('should handle empty string values', () => {
      const emptyStringSettings: Partial<SettingsProps> = {
        gatewayHost: '',
      };

      expect(emptyStringSettings.gatewayHost).toBe('');
    });

    it('should support realistic configuration scenarios', () => {
      // Enterprise setup
      const enterpriseSettings: SettingsProps = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        gatewayHost: 'linstor-gateway.company.com',
        authenticationEnabled: true,
        customLogoEnabled: true,
        hideDefaultCredential: true,
        vsanMode: false,
        hciMode: false,
        vsanAvailable: false,
      };

      expect(enterpriseSettings.gatewayEnabled).toBe(true);
      expect(enterpriseSettings.authenticationEnabled).toBe(true);
      expect(enterpriseSettings.vsanMode).toBe(false);

      // Development setup
      const devSettings: SettingsProps = {
        gatewayEnabled: false,
        gatewayCustomHost: false,
        gatewayHost: '',
        authenticationEnabled: false,
        customLogoEnabled: false,
        hideDefaultCredential: false,
        vsanMode: false,
        hciMode: false,
        vsanAvailable: false,
      };

      expect(devSettings.gatewayEnabled).toBe(false);
      expect(devSettings.authenticationEnabled).toBe(false);

      // HCI setup
      const hciSettings: SettingsProps = {
        gatewayEnabled: true,
        gatewayCustomHost: false,
        gatewayHost: '',
        authenticationEnabled: false,
        customLogoEnabled: false,
        hideDefaultCredential: false,
        vsanMode: false,
        hciMode: true,
        vsanAvailable: true,
      };

      expect(hciSettings.hciMode).toBe(true);
      expect(hciSettings.vsanAvailable).toBe(true);
    });

    it('should maintain type safety for object spread operations', () => {
      const baseSettings: Partial<SettingsProps> = {
        gatewayEnabled: false,
        authenticationEnabled: false,
      };

      const extendedSettings: Partial<SettingsProps> = {
        ...baseSettings,
        gatewayEnabled: true,
        authenticationEnabled: true,
      };

      expect(extendedSettings.gatewayEnabled).toBe(true);
      expect(extendedSettings.authenticationEnabled).toBe(true);
    });

    it('should work with Object.keys and Object.entries', () => {
      const settings: Partial<SettingsProps> = {
        gatewayEnabled: true,
        gatewayHost: 'https://example.com',
      };

      const keys = Object.keys(settings);
      const entries = Object.entries(settings);

      expect(keys).toContain('gatewayEnabled');
      expect(keys).toContain('gatewayHost');

      expect(entries.length).toBe(2);
      expect(entries[0]).toEqual(['gatewayEnabled', true]);
    });

    it('should support conditional properties based on other properties', () => {
      // Gateway host should only be relevant when gateway is custom
      const conditionalSettings: Partial<SettingsProps> = {
        gatewayEnabled: true,
        gatewayCustomHost: true,
        gatewayHost: 'custom-gateway.com',
      };

      if (conditionalSettings.gatewayEnabled && conditionalSettings.gatewayCustomHost) {
        expect(conditionalSettings.gatewayHost).toBeTruthy();
      }
    });
  });

  describe('Type Compatibility', () => {
    it('should be compatible with Partial<SettingsProps>', () => {
      const partialUpdate: Partial<SettingsProps> = {
        gatewayEnabled: true,
      };

      const fullSettings: SettingsProps = {
        gatewayEnabled: true,
        gatewayCustomHost: false,
        gatewayHost: '',
        vsanMode: false,
        hciMode: false,
        authenticationEnabled: false,
        customLogoEnabled: false,
        hideDefaultCredential: false,
        vsanAvailable: false,
        ...partialUpdate,
      };

      expect(fullSettings.gatewayEnabled).toBe(true);
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
      type SettingsWithoutHost = Omit<SettingsProps, 'gatewayHost'>;

      const settingsWithoutHost: SettingsWithoutHost = {
        gatewayEnabled: true,
        gatewayCustomHost: false,
        vsanMode: false,
        hciMode: false,
        authenticationEnabled: false,
        customLogoEnabled: false,
        hideDefaultCredential: false,
        vsanAvailable: false,
      };

      expect(settingsWithoutHost.gatewayEnabled).toBe(true);
      expect(settingsWithoutHost.gatewayCustomHost).toBe(false);
      // gatewayHost property should not exist
      expect('gatewayHost' in settingsWithoutHost).toBe(false);
    });
  });
});
