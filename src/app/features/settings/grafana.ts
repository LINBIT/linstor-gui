// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { GrafanaConfig } from './types';

/** Grafana is switched on and points at a dashboard, so there is something to show. */
export const grafanaEnabled = (config?: GrafanaConfig | null): config is GrafanaConfig =>
  !!(config?.enable && config.baseUrl && config.dashboardUid);
