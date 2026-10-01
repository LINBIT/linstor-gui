// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { logger } from '@app/utils/logger';

import { useThemeMode } from '@app/hooks';
import { useSettings } from '@app/features/settings/useSettings';

export const GrafanaDashboard = () => {
  const { grafanaConfig } = useSettings();
  const { mode } = useThemeMode();

  logger.debug('GrafanaDashboard render:', { grafanaConfig });

  // Don't show if no grafanaConfig is available or no overview URL
  if (!grafanaConfig?.dashboardUrlTemplate) {
    logger.debug('GrafanaDashboard not showing: no dashboardUrlTemplate');
    return null;
  }

  // Follow the GUI theme (light/dark) and add kiosk mode to the overview URL.
  // The mode is part of the iframe src, so a theme switch reloads the embed.
  const getUrlWithTheme = (url: string) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('theme', mode);
      urlObj.searchParams.set('kiosk', '');
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just append parameters
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}theme=${mode}&kiosk`;
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-(--bg-page)">
      <iframe
        className="h-full w-full border-none"
        title="dashboard"
        src={getUrlWithTheme(grafanaConfig.dashboardUrlTemplate)}
      />
    </div>
  );
};
