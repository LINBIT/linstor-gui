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

import '@patternfly/react-core/dist/styles/base.css';

import { store } from './store';

import { AppLayout } from '@app/layouts/AppLayout';
import { AppRoutes } from '@app/routes/routes';
import '@app/app.css';
import { useQuery } from '@tanstack/react-query';
import { NavProvider } from './NavContext';

const MSG = 'The SpaceTracking service is not installed.';

const App: React.FunctionComponent = () => {
  const getSpaceReport = () =>
    fetch('/v1/space-report')
      .then((res) => res.json())
      .then((res) => {
        return res?.reportText;
      });

  const { data } = useQuery({
    queryKey: ['getSpaceReport'],
    queryFn: getSpaceReport,
  });

  // Check if has space-report result
  const appEnabled = data && data !== MSG;

  return (
    <Provider store={store as any}>
      <Router hashType="hashbang">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#f79133',
            },
          }}
          locale={locale}
        >
          <NavProvider>
            <AppLayout registered={appEnabled}>
              <AppRoutes />
            </AppLayout>
          </NavProvider>
        </ConfigProvider>
      </Router>
    </Provider>
  );
};

export { App };
