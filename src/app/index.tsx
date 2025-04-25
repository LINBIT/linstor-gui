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
  let host = url.searchParams.get('host');
  if (host) {
    // Use pathname as base for correct relative path support
    const resolvedHost = resolveAndStoreLinstorHost(host, window.location.origin + window.location.pathname);
    if (resolvedHost) {
      url.searchParams.delete('host');
      window.location.replace(url.pathname + url.search + url.hash);
    }
  }
}

const MSG = 'The SpaceTracking service is not installed.';

const App: React.FunctionComponent = () => {
  const getSpaceReport = () => {
    const linstorHost = localStorage.getItem('LINSTOR_HOST') || '';
    return fetch(`${linstorHost}/v1/space-report`)
      .then((res) => res.json())
      .then((res) => {
        return res?.reportText;
      })
      .catch((error) => {
        console.log('error', error);
        return MSG;
      });
  };

  const { isFetched, data } = useQuery({
    queryKey: ['getSpaceReport'],
    queryFn: getSpaceReport,
  });

  // Check if has space-report result
  const appEnabled = isFetched && data && data !== MSG;

  return (
    <Provider store={store as any}>
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
            <AppLayout registered={appEnabled} isFetched={isFetched}>
              <AppRoutes />
            </AppLayout>
          </NavProvider>
        </ConfigProvider>
      </Router>
    </Provider>
  );
};

export { App };
