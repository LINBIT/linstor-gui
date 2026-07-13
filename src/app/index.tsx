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
import { getAntdTheme } from '@app/const/antdTheme';
import { applyThemeTokens, initThemeMode } from '@app/const/themeTokens';
import { resolveAndStoreLinstorHost } from '@app/utils/resolveLinstorHost';
import { setControllerAuthRequired, setControllerAuthToken } from '@app/utils/controllerAuth';
import { useSpaceReportStatus } from '@app/hooks/useSpaceReportStatus';
import GrafanaPreconnect from '@app/components/GrafanaPreconnect';
import ControllerAuthGate from '@app/components/ControllerAuthGate';

import { store } from './store';
import { NavProvider } from './NavContext';
import { ThemeModeProvider, useThemeMode } from '@app/hooks';

import '@app/app.css';

// Emit the design tokens as CSS custom properties before anything renders
// (light on :root, dark on :root[data-theme="dark"]) and restore the
// persisted theme choice.
applyThemeTokens();
initThemeMode();

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

  // Cross-origin controller-token handoff: enabling token auth switches the
  // endpoint to HTTPS (a different origin), and localStorage is origin-scoped,
  // so the token issued on the HTTP page is invisible there. The "Open HTTPS
  // Endpoint" button carries it in the hash fragment (#...?ctoken=) — which is
  // never sent to the server nor put in the Referer. Persist it for this origin,
  // then strip it so it doesn't linger in the address bar or history.
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');
  if (queryStart !== -1) {
    const hashParams = new URLSearchParams(hash.slice(queryStart + 1));
    const ctoken = hashParams.get('ctoken');
    if (ctoken) {
      setControllerAuthToken(ctoken);
      setControllerAuthRequired(true);
      hashParams.delete('ctoken');
      const rest = hashParams.toString();
      const cleanedHash = hash.slice(0, queryStart) + (rest ? `?${rest}` : '');
      window.history.replaceState(null, '', window.location.pathname + window.location.search + cleanedHash);
    }
  }
}

// Separate component so the antd theme re-derives when the mode flips.
const ThemedApp: React.FunctionComponent = () => {
  const { mode } = useThemeMode();

  return (
    <ConfigProvider theme={getAntdTheme(mode)} locale={locale}>
      <NavProvider>
        <ControllerAuthGate>
          <AuthenticatedApp />
        </ControllerAuthGate>
      </NavProvider>
    </ConfigProvider>
  );
};

const App: React.FunctionComponent = () => {
  return (
    <Provider store={store}>
      <GrafanaPreconnect />
      <Router>
        <ThemeModeProvider>
          <ThemedApp />
        </ThemeModeProvider>
      </Router>
    </Provider>
  );
};

const AuthenticatedApp: React.FunctionComponent = () => {
  const { isSpaceTrackingUnavailable, isCheckingStatus } = useSpaceReportStatus();

  return (
    <AppLayout isSpaceTrackingUnavailable={isSpaceTrackingUnavailable} isCheckingStatus={isCheckingStatus}>
      <AppRoutes />
    </AppLayout>
  );
};

export { App };
