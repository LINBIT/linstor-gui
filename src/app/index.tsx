// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/en_US';

import AppLayout from '@app/layouts/AppLayout';
import AppRoutes from '@app/routes/routes';
import { resolveAndStoreLinstorHost } from '@app/utils/resolveLinstorHost';
import { useSpaceReportStatus } from '@app/hooks/useSpaceReportStatus';
import GrafanaPreconnect from '@app/components/GrafanaPreconnect';

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

const App: React.FunctionComponent = () => {
  const { isSpaceTrackingUnavailable, isCheckingStatus } = useSpaceReportStatus();

  return (
    <Provider store={store}>
      <GrafanaPreconnect />
      <Router>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#F79133 ',
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
