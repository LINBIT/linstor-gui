// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { UIMode } from '@app/models/setting';

export interface SettingsProps {
  gatewayEnabled?: boolean;
  dashboardEnabled?: boolean;
  gatewayCustomHost?: boolean;
  dashboardURL?: string;
  authenticationEnabled?: boolean;
  customLogoEnabled?: boolean;
  gatewayHost?: string;
  hideDefaultCredential?: boolean;
  mode?: UIMode;
  vsanAvailable?: boolean;
}
