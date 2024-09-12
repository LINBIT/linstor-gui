import * as React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import useRequest from '@ahooksjs/use-request';
import '@patternfly/react-core/dist/styles/base.css';

import { AppLayout } from '@app/layouts/AppLayout';
import NotEnable from '@app/components/NotEnable/NotEnale';

import { AppRoutes } from '@app/routes/routes';

import '@app/app.css';

const MSG = 'The SpaceTracking service is not installed.';

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
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </Router>
    </Provider>
  );
};

export { App };
