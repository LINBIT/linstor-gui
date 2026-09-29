// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// Shared test doubles for the app-wide contexts. Suites mock the hook modules
// and return these values, e.g.
//
//   const settings = vi.hoisted(() => ({ current: undefined as SettingsContextValue | undefined }));
//   vi.mock('@app/features/settings/useSettings', async (orig) => ({
//     ...(await orig()),
//     useSettings: () => settings.current,
//     useUIMode: () => settings.current!.mode,
//   }));
//   beforeEach(() => { settings.current = makeSettings({ mode: UIMode.NORMAL }); });

import { vi } from 'vitest';

import type { SettingsContextValue } from '@app/features/settings/useSettings';
import type { AuthContextValue } from '@app/features/authentication/useAuth';
import { UIMode } from '@app/features/settings/types';

/** A complete settings context: empty settings, normal mode, every action a resolved vi.fn. */
export const makeSettings = (overrides: Partial<SettingsContextValue> = {}): SettingsContextValue => ({
  KVS: {},
  loaded: true,
  logo: '',
  grafanaConfig: null,
  mode: UIMode.NORMAL,
  isAdmin: false,
  gatewayAvailable: false,
  checkingGateway: false,
  evalMode: false,
  isEvalContract: false,
  refresh: vi.fn().mockResolvedValue(undefined),
  initSettingStore: vi.fn().mockResolvedValue(undefined),
  setMode: vi.fn(),
  refreshAdmin: vi.fn(),
  saveKey: vi.fn().mockResolvedValue(undefined),
  getGatewayStatus: vi.fn().mockResolvedValue(false),
  setGatewayMode: vi.fn().mockResolvedValue(undefined),
  saveGrafanaConfig: vi.fn().mockResolvedValue(true),
  setLogo: vi.fn().mockResolvedValue(undefined),
  disableCustomLogo: vi.fn().mockResolvedValue(undefined),
  getMyLinbitStatus: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

/** A complete auth context: logged out, every action a resolved vi.fn. */
export const makeAuth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  isLoggedIn: false,
  username: null,
  isAdmin: false,
  needsPasswordChange: false,
  login: vi.fn().mockResolvedValue(true),
  logout: vi.fn(),
  checkLoginStatus: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(true),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  resetPassword: vi.fn().mockResolvedValue(true),
  changePassword: vi.fn().mockResolvedValue(true),
  updatePassword: vi.fn().mockResolvedValue(true),
  resetAuthenticationSystem: vi.fn().mockResolvedValue(true),
  setNeedsPasswordChange: vi.fn(),
  ...overrides,
});
