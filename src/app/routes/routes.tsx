// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';

import { NotFound } from '@app/pages/NotFound/NotFound';
import { useDocumentTitle } from '@app/hooks';
import { UIMode } from '@app/models/setting';

import { flattenedRoutes, adminRoutes, IAppRoute } from './route-config';
import vsan from './vsan';
import hci from './hci';

// Component to handle setting document title and rendering the component
const RouteWithTitleUpdates = ({ component: Component, title, ...rest }: IAppRoute) => {
  useDocumentTitle(title);
  return <Component {...rest} />;
};

const AppRoutes = (): React.ReactElement => {
  const [displayedRoutes, setDisplayedRoutes] = useState(flattenedRoutes);
  const location = useLocation();

  const { KVS, vsanModeFromSettings, hciModeFromSettings, isAdmin, grafanaConfig } = useSelector(
    (state: RootState) => ({
      KVS: state.setting.KVS,
      vsanModeFromSettings: state.setting.mode === UIMode.VSAN,
      hciModeFromSettings: state.setting.mode === UIMode.HCI,
      isAdmin: state.setting.isAdmin,
      grafanaConfig: state.setting.grafanaConfig,
    }),
  );

  const dispatch = useDispatch<Dispatch>();
  useEffect(() => {
    const gatewayEnabled = KVS?.gatewayEnabled;
    // Use grafanaConfig to determine if dashboard is enabled
    const dashboardEnabled = !!grafanaConfig?.baseUrl;

    const initialOpenFromVSAN = location.pathname === '/vsan/dashboard' && location.search === '?vsan=true';
    const initialOpenFromHCI = location.pathname === '/hci/dashboard' && location.search === '?hci=true';

    const VSAN_MODE = vsanModeFromSettings || initialOpenFromVSAN;
    const HCI_MODE = hciModeFromSettings || initialOpenFromHCI;

    if (VSAN_MODE) {
      setDisplayedRoutes(vsan);
    } else if (HCI_MODE) {
      setDisplayedRoutes(hci);
    } else {
      let filteredRoutes = [...flattenedRoutes];
      if (!gatewayEnabled) {
        filteredRoutes = filteredRoutes.filter((route) => !route.path.startsWith('/gateway'));
      }

      if (!dashboardEnabled) {
        filteredRoutes = filteredRoutes.filter((route) => {
          return route.path !== '/grafana' && !route.path.startsWith('/stats/');
        });
      }

      if (KVS?.authenticationEnabled && !isAdmin) {
        filteredRoutes = filteredRoutes.filter((route) => {
          return !adminRoutes.includes(route.path);
        });
      }

      setDisplayedRoutes(filteredRoutes);
    }
  }, [
    dispatch.setting,
    location,
    vsanModeFromSettings,
    hciModeFromSettings,
    isAdmin,
    KVS?.authenticationEnabled,
    KVS?.gatewayEnabled,
    grafanaConfig,
  ]);

  return (
    <Routes>
      {displayedRoutes.map(({ path, component: Component, title, isAsync }, idx) => (
        <Route
          key={idx}
          path={path}
          element={<RouteWithTitleUpdates component={Component} path={path} title={title} isAsync={isAsync} />}
        />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
