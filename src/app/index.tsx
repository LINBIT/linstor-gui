// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import locale from 'antd/locale/en_US';

import AppLayout from '@app/layouts/AppLayout';
import { AppRoutes } from '@app/routes/routes';
import { resolveAndStoreLinstorHost } from '@app/utils/resolveLinstorHost';

import { store } from './store';
import { NavProvider } from './NavContext';

import '@app/app.css';

if (typeof window !== 'undefined') {
  const url = new URL(window.location.href);
  const host = url.searchParams.get('host');
  if (host) {
    // Use pathname as base for correct relative path support
    const resolvedHost = resolveAndStoreLinstorHost(host, window.location.origin + window.location.pathname);
    if (resolvedHost) {
      url.searchParams.delete('host');
      window.location.replace(url.pathname + url.search + url.hash);
    }
  }
}

const SPACE_TRACKING_UNAVAILABLE_MSG = 'The SpaceTracking service is not installed.';

const App: React.FunctionComponent = () => {
  const getSpaceReport = async () => {
    const linstorHost = localStorage.getItem('LINSTOR_HOST') || '';
    try {
      const response = await fetch(`${linstorHost}/v1/space-report`);

      if (!response.ok) {
        return null;
      }
      const res = await response.json();

      if (res?.reportText === SPACE_TRACKING_UNAVAILABLE_MSG) {
        return SPACE_TRACKING_UNAVAILABLE_MSG;
      }
      return res.reportText;
    } catch {
      return null;
    }
  };

  const { isFetched, isSuccess, data } = useQuery<string | null, Error>({
    queryKey: ['getSpaceReportStatus'],
    queryFn: getSpaceReport,
  });

  const isSpaceTrackingUnavailable = isSuccess && data === SPACE_TRACKING_UNAVAILABLE_MSG;
  const isCheckingStatus = !isFetched;

  return (
    <Provider store={store}>
      <Router>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#f79133',
            },
          }}
          locale={locale}
        >
          <NavProvider>
            <AppLayout isSpaceTrackingUnavailable={isSpaceTrackingUnavailable} isCheckingStatus={isCheckingStatus}>
              <AppRoutes />
            </AppLayout>
          </NavProvider>
        </ConfigProvider>
      </Router>
    </Provider>
  );
};

export { App };
