// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { RootState } from '@app/store';
import styled from '@emotion/styled';
import { useSelector } from 'react-redux';

const PageContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px);
  background-color: white;
`;

const IFramePage = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

export const GrafanaDashboard = () => {
  const grafanaConfig = useSelector((state: RootState) => state.setting?.grafanaConfig);

  console.log('GrafanaDashboard render:', { grafanaConfig });

  // Don't show if no grafanaConfig is available or no overview URL
  if (!grafanaConfig?.dashboardUrlTemplate) {
    console.log('GrafanaDashboard not showing: no dashboardUrlTemplate');
    return null;
  }

  // Add theme=light and kiosk mode to the overview URL
  const getUrlWithTheme = (url: string) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('theme', 'light');
      urlObj.searchParams.set('kiosk', '');
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just append parameters
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}theme=light&kiosk`;
    }
  };

  return (
    <PageContainer>
      <IFramePage title="dashboard" src={getUrlWithTheme(grafanaConfig.dashboardUrlTemplate)} />
    </PageContainer>
  );
};
