// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { RootState } from '@app/store';
import { logger } from '@app/utils/logger';
import styled from '@emotion/styled';
import { useSelector } from 'react-redux';

import { useThemeMode } from '@app/hooks';

const PageContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px);
  background-color: var(--bg-page);
`;

const IFramePage = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

export const GrafanaDashboard = () => {
  const grafanaConfig = useSelector((state: RootState) => state.setting?.grafanaConfig);
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
    <PageContainer>
      <IFramePage title="dashboard" src={getUrlWithTheme(grafanaConfig.dashboardUrlTemplate)} />
    </PageContainer>
  );
};
