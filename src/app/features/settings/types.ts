// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export type { SettingsProps } from './SettingsAPI';

export enum UIMode {
  NORMAL = 'NORMAL',
  VSAN = 'VSAN',
  HCI = 'HCI',
}

/** What the Grafana settings form hands to saveGrafanaConfig; unset fields get defaults. */
export interface GrafanaConfigInput {
  enable?: boolean;
  dashboardUrl?: string;
  dashboardUid?: string;
  panelIds?: GrafanaConfig['panelIds'];
  drbdEnable?: boolean;
  drbdUrl?: string;
  drbdUid?: string;
  drbdWriteRatePanelId?: number;
  drbdReadRatePanelId?: number;
}

export interface GrafanaConfig {
  enable: boolean;
  baseUrl: string;
  dashboardUid?: string;
  dashboardTitle?: string;
  datasourceId?: string;
  datasourceName?: string;
  panelIds: {
    cpu?: number;
    memory?: number;
    network?: number;
    disk?: number;
    diskIops?: number;
    ioUsage?: number;
  };
  // Full dashboard URL template with ${node} placeholder
  dashboardUrlTemplate?: string;
  // DRBD dashboard configuration
  drbdEnable?: boolean;
  drbdUrl?: string;
  drbdUid?: string;
  drbdWriteRatePanelId?: number;
  drbdReadRatePanelId?: number;
}
