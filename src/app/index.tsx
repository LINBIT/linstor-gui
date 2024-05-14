import * as React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/en_US';

import '@patternfly/react-core/dist/styles/base.css';

import { store } from './store';

import { AppLayout } from '@app/layouts/AppLayout';
import NotEnable from '@app/components/NotEnable/NotEnale';
import { AppRoutes } from '@app/routes/routes';
import '@app/app.css';
import { useQuery } from '@tanstack/react-query';

const MSG = 'The SpaceTracking service is not installed.';

const App: React.FunctionComponent = () => {
  const getSpaceReport = () =>
    fetch('/v1/space-report')
      .then((res) => res.json())
      .then((res) => res);

  const { isLoading, error, data } = useQuery({
    queryKey: ['getSpaceReport'],
    queryFn: getSpaceReport,
  });

  // Check if has space-report result
  const appEnabled = data?.reportText && data?.reportText !== MSG;

  if (!isLoading && (error || !appEnabled)) {
    return <NotEnable />;
  }

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
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </ConfigProvider>
      </Router>
    </Provider>
  );
};

export { App };
