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

import Dashboard from '@app/pages/Dashboard/Dashboard';
import NodeList from '@app/pages/Inventory/Nodes';
import NodeDetail from '@app/pages/Inventory/Nodes/detail';
import NodeCreate from '@app/pages/Inventory/Nodes/create';
import NodeEdit from '@app/pages/Inventory/Nodes/edit';
import StoragePoolList from '@app/pages/Inventory/StoragePools';
import StoragePoolCreate from '@app/pages/Inventory/StoragePools/create';
import StoragePoolEdit from '@app/pages/Inventory/StoragePools/edit';
import ResourceGroupList from '@app/pages/SoftwareDefined/ResourceGroups';
import ResourceGroupEdit from '@app/pages/SoftwareDefined/ResourceGroups/edit';
import ResourceGroupCreate from '@app/pages/SoftwareDefined/ResourceGroups/create';
import ResourceCreate from '@app/pages/SoftwareDefined/Resources/create';
import ResourceEdit from '@app/pages/SoftwareDefined/Resources/edit';
import RemoteList from '@app/pages/Backup/Remote/RemoteList';
import ScheduleList from '@app/pages/Backup/ScheduleList';
import ScheduleResource from '@app/pages/Backup/ScheduleList/ScheduleByResourceist';
import BackupList from '@app/pages/Backup/Remote/BackupList';
import ErrorReportList from '@app/pages/ErrorReport/index';
import ErrorReportDetail from '@app/pages/ErrorReport/Detail';
import { NotFound } from '@app/pages/NotFound/NotFound';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';
import { GrafanaDashboard } from '@app/pages/Grafana';
import { Controller } from '@app/pages/Inventory/Controller';
import { UserManagement } from '@app/features/authentication';
import GeneralSettings from '@app/pages/Settings';
import ResourceOverview from '@app/pages/SoftwareDefined/Resources/overview';
import ResourceDefinitionCreate from '@app/pages/SoftwareDefined/ResourceDefinitions/create';

import gateway from './gateway';
import snapshot from './snapshot';
import vsan from './vsan';

export interface IAppRoute {
  label?: string;
  component: React.ComponentType<any>;
  exact?: boolean; // Not needed in v7 but kept for backward compatibility
  path: string;
  title: string;
  isAsync?: boolean;
  routes?: undefined;
  hide?: boolean;
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
  hide?: boolean;
}

export type AppRouteConfig = IAppRoute | IAppRouteGroup;

const routes: AppRouteConfig[] = [
  {
    component: Dashboard,
    exact: true,
    path: '/',
    title: 'LINSTOR | Main Dashboard',
  },
  {
    component: GrafanaDashboard,
    exact: true,
    path: '/grafana',
    title: 'LINSTOR | Grafana Dashboard',
    label: 'grafana',
  },
  {
    label: 'inventory',
    routes: [
      {
        component: NodeList,
        exact: true,
        label: 'node',
        path: '/inventory/nodes',
        title: 'LINSTOR | Inventory | Nodes',
      },
      {
        component: NodeCreate,
        exact: true,
        path: '/inventory/nodes/create',
        title: 'LINSTOR | Inventory | Nodes | Create',
      },
      {
        component: Controller,
        exact: true,
        path: '/inventory/controller',
        title: 'LINSTOR | Inventory | Controller',
      },
      {
        component: NodeDetail,
        exact: true,
        path: '/inventory/nodes/:node',
        title: 'LINSTOR | Inventory | Nodes',
      },
      {
        component: NodeEdit,
        exact: true,
        path: '/inventory/nodes/edit/:node',
        title: 'LINSTOR | Inventory | Nodes | Edit',
      },
      {
        component: StoragePoolEdit,
        exact: true,
        path: '/inventory/storage-pools/:node/:storagePool/edit',
        title: 'LINSTOR | Inventory | Storage Pools',
      },
      {
        component: StoragePoolList,
        exact: true,
        label: 'storage_pools',
        path: '/inventory/storage-pools',
        title: 'LINSTOR | Inventory | Storage Pools',
      },
      {
        component: StoragePoolCreate,
        exact: true,
        path: '/inventory/storage-pools/create',
        title: 'LINSTOR | Inventory | Storage Pools',
      },
    ],
  },
  {
    label: 'software_defined',
    routes: [
      {
        component: ResourceGroupList,
        exact: true,
        label: 'resource_groups',
        path: '/storage-configuration/resource-groups',
        title: 'LINSTOR | Storage Configuration | Resource Groups',
      },
      {
        component: ResourceGroupEdit,
        exact: true,
        path: '/storage-configuration/resource-groups/:resourceGroup/edit',
        title: 'LINSTOR | Storage Configuration | Resource Groups | Edit',
      },
      {
        component: ResourceGroupCreate,
        exact: true,
        path: '/storage-configuration/resource-groups/create',
        title: 'LINSTOR | Storage Configuration | Resource Groups | Create',
      },
      {
        component: ResourceOverview,
        exact: true,
        label: 'resource_overview',
        path: '/storage-configuration/resource-overview',
        title: 'LINSTOR | Storage Configuration | Resource Overview',
      },
      {
        component: ResourceCreate,
        exact: true,
        path: '/storage-configuration/resources/create',
        title: 'LINSTOR | Storage Configuration | Resources | Create',
      },
      {
        component: ResourceEdit,
        exact: true,
        path: '/storage-configuration/resources/:node/:resource/edit',
        title: 'LINSTOR | Storage Configuration | Resources | Edit',
      },
      {
        component: ResourceDefinitionCreate,
        exact: true,
        label: 'resource_definition_create',
        path: '/storage-configuration/resource-definitions/create',
        title: 'LINSTOR | Storage Configuration | Resource Definitions | Create',
      },
    ],
  },
  ...snapshot,
  {
    label: 'Backup/DR',
    routes: [
      {
        component: RemoteList,
        exact: true,
        label: 'remote',
        path: '/remote/list',
        title: 'LINSTOR | Remote | List',
      },
      {
        component: ScheduleResource,
        exact: true,
        label: 'schedule',
        path: '/schedule/list-by-resource',
        title: 'LINSTOR | Schedule | List By Resource',
      },
      {
        component: ScheduleList,
        exact: true,
        label: 'schedule',
        path: '/schedule/list',
        title: 'LINSTOR | Schedule | List',
      },
      {
        component: BackupList,
        exact: true,
        label: 'backup',
        path: '/remote/:remote_name/backups',
        title: 'LINSTOR | Remote | BackUp List',
      },
    ],
  },
  ...gateway,
  {
    component: ErrorReportList,
    exact: true,
    isAsync: true,
    label: 'error_reports',
    path: '/error-reports',
    title: 'LINSTOR | Error Reports',
  },
  {
    component: ErrorReportDetail,
    exact: true,
    isAsync: true,
    path: '/error-reports/:id',
    title: 'LINSTOR | Error Report Detail',
  },
  {
    component: GeneralSettings,
    exact: true,
    path: '/settings',
    label: 'settings',
    title: 'LINSTOR | Setting',
  },

  {
    component: UserManagement,
    exact: true,
    path: '/users',
    label: 'users',
    title: 'LINSTOR | Users',
  },
];

// Component to handle setting document title and rendering the component
const RouteWithTitleUpdates = ({ component: Component, title, ...rest }: IAppRoute) => {
  useDocumentTitle(title);
  return <Component {...rest} />;
};

const flattenedRoutes: IAppRoute[] = routes
  .reduce((flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])], [] as IAppRoute[])
  .filter((e) => !e.hide);

const adminRoutes = ['/settings', '/users'];

const AppRoutes = (): React.ReactElement => {
  const [displayedRoutes, setDisplayedRoutes] = useState(flattenedRoutes);
  const location = useLocation();

  const { KVS, vsanModeFromSettings, isAdmin } = useSelector((state: RootState) => ({
    KVS: state.setting.KVS,
    vsanModeFromSettings: state.setting.vsanMode,
    isAdmin: state.setting.isAdmin,
  }));

  const dispatch = useDispatch<Dispatch>();
  useEffect(() => {
    const vsanModeFromKVS = KVS?.vsanMode;
    const gatewayEnabled = KVS?.gatewayEnabled;
    const dashboardEnabled = KVS?.dashboardEnabled;

    const initialOpenFromVSAN = location.pathname === '/vsan/dashboard' && location.search === '?vsan=true';

    const VSAN_MODE = (vsanModeFromSettings && vsanModeFromKVS) || initialOpenFromVSAN;

    if (VSAN_MODE) {
      setDisplayedRoutes(vsan);
    } else {
      let filteredRoutes = [...flattenedRoutes];
      if (!gatewayEnabled) {
        filteredRoutes = filteredRoutes.filter((route) => !route.path.startsWith('/gateway'));
      }

      if (!dashboardEnabled) {
        filteredRoutes = filteredRoutes.filter((route) => route.path !== '/grafana');
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
    KVS?.vsanMode,
    vsanModeFromSettings,
    isAdmin,
    KVS?.authenticationEnabled,
    KVS?.gatewayEnabled,
    KVS?.dashboardEnabled,
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

export { AppRoutes, routes };
