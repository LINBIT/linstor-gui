// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { unwrap } from '@app/features/requests';
import { createOrModifyKVInstance } from '@app/features/keyValueStore/api';
import { logger } from '@app/utils/logger';
import { isSvg } from '@app/utils/isSvg';
import { kvStore } from '@app/features/keyValueStore';
import { KV_NAMESPACES } from '@app/const/kvstore';
import { GRAFANA_KEY_VALUE_STORE_KEY } from '@app/const/settings';

import settingAPI, { SettingsAPI, type SettingsProps } from './SettingsAPI';
import { UIMode, type GrafanaConfig, type GrafanaConfigInput } from './types';

// The GUI keeps its settings in the "__gui__settings" key-value-store
// instance; the store only holds strings.
const SETTING_KEY = KV_NAMESPACES.SETTINGS;

const DEFAULT_DRBD_WRITE_PANEL = 28;
const DEFAULT_DRBD_READ_PANEL = 29;

export interface GuiSettings {
  KVS: SettingsProps;
  logo: string;
  grafanaConfig: GrafanaConfig | null;
}

const generateGrafanaDashboardUrl = (uid: string): string =>
  `${window.location.protocol}//${window.location.hostname}:3000/d/${uid}/node-exporter-full?orgId=1&refresh=1m`;

const generateDrbdDashboardUrl = (uid: string): string =>
  `${window.location.protocol}//${window.location.hostname}:3000/d/${uid}/drbd?orgId=1&refresh=30s`;

const baseUrlOf = (dashboardUrl?: string): string => {
  if (!dashboardUrl) return '';
  try {
    const url = new URL(dashboardUrl);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    logger.error('Failed to parse dashboardUrl:', e);
    return '';
  }
};

export const modeOf = (props: Partial<SettingsProps>): UIMode =>
  props.vsanMode ? UIMode.VSAN : props.hciMode ? UIMode.HCI : UIMode.NORMAL;

/** The custom logo: a URL, or an SVG stored in 4 KiB chunks listed by logoStr. */
const loadLogo = async (): Promise<string> => {
  const logoProps = await kvStore.get('logo');
  const logoUrl = logoProps?.props?.['logoUrl'] ?? '';
  if (logoUrl !== '') return logoUrl;
  const logoStr = logoProps?.props?.['logoStr'] ?? '';
  return logoStr
    .split(',')
    .map((key) => logoProps?.props?.[key])
    .join('');
};

/**
 * Grafana settings from their own "__grafana__ui__settings" instance; null when
 * disabled or never saved. Missing dashboard URLs are derived from their UIDs
 * and written back, as older GUIs stored only the UIDs.
 */
const loadGrafanaConfig = async (): Promise<GrafanaConfig | null> => {
  if (!(await kvStore.instanceExists(GRAFANA_KEY_VALUE_STORE_KEY))) return null;
  const props = (await kvStore.get(GRAFANA_KEY_VALUE_STORE_KEY))?.props;
  if (!props || String(props.enable) !== 'true') return null;

  const urlsToUpdate: Record<string, string> = {};
  let dashboardUrl = props.dashboardUrl as string;
  let drbdUrl = props.drbdUrl as string;
  const drbdEnable = String(props.drbdEnable) === 'true';

  if (!dashboardUrl && props.dashboardUid) {
    dashboardUrl = generateGrafanaDashboardUrl(props.dashboardUid as string);
    urlsToUpdate.dashboardUrl = dashboardUrl;
  }
  if (drbdEnable && !drbdUrl && props.drbdUid) {
    drbdUrl = generateDrbdDashboardUrl(props.drbdUid as string);
    urlsToUpdate.drbdUrl = drbdUrl;
  }
  if (Object.keys(urlsToUpdate).length > 0) {
    try {
      await unwrap(createOrModifyKVInstance(GRAFANA_KEY_VALUE_STORE_KEY, { override_props: urlsToUpdate }));
    } catch (e) {
      // The derived URLs are still used for this session.
      logger.error('Failed to save auto-generated URLs:', e);
    }
  }

  return {
    enable: true,
    baseUrl: baseUrlOf(dashboardUrl),
    dashboardUid: props.dashboardUid as string,
    panelIds: {
      cpu: Number(props.panelIdCpu),
      memory: Number(props.panelIdMemory),
      network: Number(props.panelIdNetwork),
      disk: Number(props.panelIdDisk),
      diskIops: Number(props.panelIdDiskIops),
      ioUsage: Number(props.panelIdIoUsage),
    },
    dashboardUrlTemplate: dashboardUrl,
    drbdEnable,
    drbdUrl,
    drbdUid: props.drbdUid as string,
    drbdWriteRatePanelId: Number(props.drbdWriteRatePanelId) || DEFAULT_DRBD_WRITE_PANEL,
    drbdReadRatePanelId: Number(props.drbdReadRatePanelId) || DEFAULT_DRBD_READ_PANEL,
  };
};

/** Everything the GUI reads from its settings instances; null before the GUI was initialised. */
export const loadGuiSettings = async (): Promise<GuiSettings | null> => {
  if (!(await SettingsAPI.instanceExists())) return null;
  const KVS = await settingAPI.getProps();
  // The logo and Grafana are extras: a failure there must not lose the props,
  // which decide the login screen, the mode and the gateway.
  const [logo, grafanaConfig] = await Promise.all([
    KVS.customLogoEnabled
      ? loadLogo().catch((e) => {
          logger.error('Failed to load the custom logo:', e);
          return '';
        })
      : '',
    loadGrafanaConfig().catch((e) => {
      logger.error('Failed to load Grafana configuration:', e);
      return null;
    }),
  ]);
  return { KVS, logo, grafanaConfig };
};

// The key-value store keeps strings; true is stored as "true" either way.
export const saveSettingKeys = (props: Record<string, number | string | boolean>) =>
  unwrap(
    createOrModifyKVInstance(SETTING_KEY, {
      override_props: Object.fromEntries(Object.entries(props).map(([key, value]) => [key, String(value)])),
    }),
  );

/** Writes the Grafana form; the key-value store only takes strings, unset panel IDs are left out. */
export const saveGrafanaConfig = async (config: GrafanaConfigInput): Promise<void> => {
  const values = {
    enable: config.enable || false,
    dashboardUrl: config.dashboardUrl || '',
    dashboardUid: config.dashboardUid || '',
    panelIdCpu: config.panelIds?.cpu,
    panelIdMemory: config.panelIds?.memory,
    panelIdNetwork: config.panelIds?.network,
    panelIdDisk: config.panelIds?.disk,
    panelIdDiskIops: config.panelIds?.diskIops,
    panelIdIoUsage: config.panelIds?.ioUsage,
    drbdEnable: config.drbdEnable || false,
    drbdUrl: config.drbdUrl || '',
    drbdUid: config.drbdUid || '',
    drbdWriteRatePanelId: config.drbdWriteRatePanelId || DEFAULT_DRBD_WRITE_PANEL,
    drbdReadRatePanelId: config.drbdReadRatePanelId || DEFAULT_DRBD_READ_PANEL,
  };
  const overrideProps = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
  if (await kvStore.instanceExists(GRAFANA_KEY_VALUE_STORE_KEY)) {
    await unwrap(createOrModifyKVInstance(GRAFANA_KEY_VALUE_STORE_KEY, { override_props: overrideProps }));
  } else {
    await kvStore.create(GRAFANA_KEY_VALUE_STORE_KEY, { override_props: overrideProps });
  }
};

const LOGO_CHUNK = 4096;

/** Stores a logo URL, or an SVG split into 4 KiB chunks (one prop per chunk, listed in logoStr). */
export const saveLogo = async ({ logoSvg, logoUrl }: { logoSvg: string; logoUrl?: string }): Promise<void> => {
  const overrideProps: Record<string, string> = { logoStr: '', logoUrl: '' };
  if (logoUrl) {
    overrideProps.logoUrl = logoUrl;
  } else if (isSvg(logoSvg)) {
    const keys: string[] = [];
    for (let i = 0; i * LOGO_CHUNK < logoSvg.length; i++) {
      overrideProps[`logoSvg_${i}`] = logoSvg.slice(i * LOGO_CHUNK, (i + 1) * LOGO_CHUNK);
      keys.push(`logoSvg_${i}`);
    }
    overrideProps.logoStr = keys.join(',');
  }
  await kvStore.create('logo', { override_props: overrideProps });
  await settingAPI.setProps({ customLogoEnabled: true });
};
