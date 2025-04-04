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

import { store } from './store';
import { NavProvider } from './NavContext';

import '@app/app.css';

const MSG = 'The SpaceTracking service is not installed.';

const App: React.FunctionComponent = () => {
  const getSpaceReport = () =>
    fetch('/v1/space-report')
      .then((res) => res.json())
      .then((res) => {
        return res?.reportText;
      })
      .catch((error) => {
        console.log('error', error);
        return MSG;
      });

  const { isFetched, data } = useQuery({
    queryKey: ['getSpaceReport'],
    queryFn: getSpaceReport,
  });

  // Check if has space-report result
  const appEnabled = isFetched && data && data !== MSG;

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
