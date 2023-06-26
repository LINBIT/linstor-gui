import * as React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/en_US';

import useRequest from '@ahooksjs/use-request';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@patternfly/react-core/dist/styles/base.css';

import { store } from './store';

import { AppLayout } from '@app/layouts/AppLayout';
import NotEnable from '@app/components/NotEnable/NotEnale';
import { AppRoutes } from '@app/routes/routes';
import '@app/app.css';

const MSG = 'The SpaceTracking service is not installed.';
const queryClient = new QueryClient();

const App: React.FunctionComponent = () => {
  const { data, error, loading } = useRequest('/v1/space-report');

  // Check if has space-report result
  const appEnabled = data?.reportText && data?.reportText !== MSG;

  if (!loading && (error || !appEnabled)) {
    return <NotEnable />;
  }

  return (
    <Provider store={store}>
      <Router hashType="hashbang">
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#f79133',
              },
            }}
            locale={locale}
          >
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </ConfigProvider>
        </QueryClientProvider>
      </Router>
    </Provider>
  );
};

export { App };
