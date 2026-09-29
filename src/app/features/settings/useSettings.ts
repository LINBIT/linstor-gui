// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createContext, useContext } from 'react';

import type { SettingsProps } from './SettingsAPI';
import type { GrafanaConfig, GrafanaConfigInput, UIMode } from './types';

export const GUI_SETTINGS_QUERY_KEY = ['gui-settings'];

export interface SettingsContextValue {
  /** The "__gui__settings" props; empty until loaded (or before the GUI was initialised). */
  KVS: Partial<SettingsProps>;
  /** Whether the settings instance has been read at least once. */
  loaded: boolean;
  logo: string;
  grafanaConfig: GrafanaConfig | null;
  mode: UIMode;
  isAdmin: boolean;
  gatewayAvailable: boolean;
  checkingGateway: boolean;
  evalMode: boolean;
  isEvalContract: boolean;

  /** Re-reads the settings instances (what `getSettings` did). */
  refresh: () => Promise<void>;
  initSettingStore: (mode: UIMode) => Promise<void>;
  setMode: (mode: UIMode) => void;
  /** Recomputes isAdmin after a login or logout changed the stored user. */
  refreshAdmin: () => void;
  saveKey: (props: Record<string, number | string | boolean>) => Promise<unknown>;
  getGatewayStatus: (host?: string) => Promise<boolean>;
  setGatewayMode: (args: {
    gatewayEnabled: boolean;
    customHost: boolean;
    host: string;
    showToast?: boolean;
  }) => Promise<void>;
  saveGrafanaConfig: (config: GrafanaConfigInput) => Promise<boolean>;
  setLogo: (payload: { logoSvg: string; logoUrl?: string }) => Promise<void>;
  disableCustomLogo: () => Promise<void>;
  getMyLinbitStatus: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};

/** The UI mode alone, for the many lists that only switch columns on it. */
export const useUIMode = (): UIMode => useSettings().mode;
