// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { lazy } from 'react';

const Dashboard = lazy(() => import('@app/pages/Dashboard/Dashboard'));
const NodeList = lazy(() => import('@app/pages/Inventory/Nodes'));
const NodeDetail = lazy(() => import('@app/pages/Inventory/Nodes/detail'));
const NodeCreate = lazy(() => import('@app/pages/Inventory/Nodes/create'));
const NodeEdit = lazy(() => import('@app/pages/Inventory/Nodes/edit'));
const StoragePoolList = lazy(() => import('@app/pages/Inventory/StoragePools'));
const StoragePoolCreate = lazy(() => import('@app/pages/Inventory/StoragePools/create'));
const StoragePoolEdit = lazy(() => import('@app/pages/Inventory/StoragePools/edit'));
const ResourceGroupList = lazy(() => import('@app/pages/SoftwareDefined/ResourceGroups'));
const ResourceGroupEdit = lazy(() => import('@app/pages/SoftwareDefined/ResourceGroups/edit'));
const ResourceGroupCreate = lazy(() => import('@app/pages/SoftwareDefined/ResourceGroups/create'));
const ResourceCreate = lazy(() => import('@app/pages/SoftwareDefined/Resources/create'));
const ResourceEdit = lazy(() => import('@app/pages/SoftwareDefined/Resources/edit'));
const RemoteList = lazy(() => import('@app/pages/Backup/Remote/RemoteList'));
const ScheduleList = lazy(() => import('@app/pages/Backup/ScheduleList'));
const ScheduleResource = lazy(() => import('@app/pages/Backup/ScheduleList/ScheduleByResourceist'));
const BackupList = lazy(() => import('@app/pages/Backup/Remote/BackupList'));
const ErrorReportList = lazy(() => import('@app/pages/ErrorReport/index'));
const ErrorReportDetail = lazy(() => import('@app/pages/ErrorReport/Detail'));
const GrafanaDashboard = lazy(() => import('@app/pages/Grafana').then((m) => ({ default: m.GrafanaDashboard })));
const GrafanaStats = lazy(() => import('@app/pages/GrafanaStats'));
const Controller = lazy(() => import('@app/pages/Inventory/Controller').then((m) => ({ default: m.Controller })));
const UserManagement = lazy(() => import('@app/features/authentication').then((m) => ({ default: m.UserManagement })));
const GeneralSettings = lazy(() => import('@app/pages/Settings'));
const AuthTokens = lazy(() => import('@app/pages/AuthTokens'));
const ResourceOverview = lazy(() => import('@app/pages/SoftwareDefined/Resources/overview'));
const ResourceDefinitionCreate = lazy(() => import('@app/pages/SoftwareDefined/ResourceDefinitions/create'));
const HA = lazy(() => import('@app/pages/HA'));

import gateway from './gateway';
import snapshot from './snapshot';
import files from './files';

export interface IAppRoute {
  label?: string;
  component: React.ComponentType<Record<string, unknown>>;
  exact?: boolean;
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

export const routes: AppRouteConfig[] = [
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
    component: GrafanaStats,
    exact: true,
    path: '/stats/:nodeName/:resourceName',
    title: 'LINSTOR | Node Stats',
    hide: true,
  },
  {
    component: GrafanaStats,
    exact: true,
    path: '/stats/:nodeName',
    title: 'LINSTOR | Node Stats',
    hide: true,
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
  ...files,
  {
    component: HA,
    exact: true,
    isAsync: true,
    label: 'reactor',
    path: '/reactor',
    title: 'LINSTOR | Reactor',
  },
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
  {
    component: AuthTokens,
    exact: true,
    path: '/auth-tokens',
    label: 'auth_tokens',
    title: 'LINSTOR | Auth Tokens',
  },
];

export const flattenedRoutes: IAppRoute[] = routes
  .reduce((flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])], [] as IAppRoute[])
  .filter((e) => !e.hide || e.path.startsWith('/stats/'));

export const adminRoutes = ['/settings', '/users', '/auth-tokens'];
