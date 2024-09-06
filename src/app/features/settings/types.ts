// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export interface SettingsProps {
  gatewayEnabled?: boolean;
  dashboardEnabled?: boolean;
  gatewayCustomHost?: boolean;
  vsanMode?: boolean;
  dashboardURL?: string;
  authenticationEnabled?: boolean;
  customLogoEnabled?: boolean;
  gatewayHost?: string;
  hideDefaultCredential?: boolean;
}
