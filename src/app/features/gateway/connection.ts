// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/** Where the gateway requests go (set from the settings, see SettingsProvider). */
export const currentGatewayHost = (): string => window.localStorage.getItem('GATEWAY_HOST') ?? '';

/**
 * A page served over HTTPS calling the gateway over plain HTTP: browsers treat
 * that as mixed content, which Firefox blocks and Chromium only warns about.
 */
export const isMixedContent = (host: string, pageProtocol: string = window.location.protocol): boolean =>
  pageProtocol === 'https:' && /^http:\/\//i.test(host.trim());

/** The gateway's status URL, to open in a tab and accept its certificate. */
export const gatewayStatusUrl = (host: string): string => `${host.trim().replace(/\/+$/, '')}/api/v2/status`;
