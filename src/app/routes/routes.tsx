// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Route, RouteComponentProps, Switch, useHistory } from 'react-router-dom';

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
import ResourceDefinitionList from '@app/pages/SoftwareDefined/ResourceDefinitions';
import ResourceDefinitionCreate from '@app/pages/SoftwareDefined/ResourceDefinitions/create';
import ResourceDefinitionEdit from '@app/pages/SoftwareDefined/ResourceDefinitions/edit';
import ResourceList from '@app/pages/SoftwareDefined/Resources';
import ResourceCreate from '@app/pages/SoftwareDefined/Resources/create';
import ResourceEdit from '@app/pages/SoftwareDefined/Resources/edit';
import VolumeList from '@app/pages/SoftwareDefined/Volumes';
import RemoteList from '@app/pages/Remote/RemoteList';
import BackupList from '@app/pages/Remote/BackupList';
import ErrorReportList from '@app/pages/ErrorReport/index';
import ErrorReportDetail from '@app/pages/ErrorReport/Detail';

import { NotFound } from '@app/pages/NotFound/NotFound';
import GeneralSettings from '@app/pages/Settings';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

import { GrafanaDashboard } from '@app/pages/Granfana';
import { UserManagement } from '@app/features/authentication';

import gateway from './gateway';
import snapshot from './snapshot';
import { Dashboard as VSANDashboard } from '@app/pages/VSAN/Dashboard';
import { NVMeoF } from '@app/pages/VSAN/NVMeoF';
import { NFS } from '@app/pages/VSAN/NFS';
import { ISCSI } from '@app/pages/VSAN/ISCSI';
import { PhysicalStorage } from '@app/pages/VSAN/PhysicalStorage';
import { About } from '@app/pages/VSAN/About';
import { ResourceGroup } from '@app/pages/VSAN/ResourceGroup';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch, RootState } from '@app/store';
import VolumeDefinitionList from '@app/pages/SoftwareDefined/VolumeDefinitions';
import { Controller } from '@app/pages/Inventory/Controller';
import ResourceOverview from '@app/pages/SoftwareDefined/Resources/overview';

export interface IAppRoute {
  label?: string; // Excluding the label will exclude the route from the nav sidebar in AppLayout
  /* eslint-disable @typescript-eslint/no-explicit-any */
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
  /* eslint-enable @typescript-eslint/no-explicit-any */
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
        component: ResourceDefinitionList,
        exact: true,
        label: 'resource_definitions',
        path: '/storage-configuration/resource-definitions',
        title: 'LINSTOR | Storage Configuration | Resource Definitions',
      },
      {
        component: VolumeDefinitionList,
        exact: true,
        label: 'volume_definitions',
        path: '/storage-configuration/volume-definitions',
        title: 'LINSTOR | Storage Configuration | Volume Definitions',
      },
      {
        component: ResourceDefinitionCreate,
        exact: true,
        path: '/storage-configuration/resource-definitions/create',
        title: 'LINSTOR | Storage Configuration | Resource Definitions | Create',
      },
      {
        component: ResourceDefinitionEdit,
        exact: true,
        path: '/storage-configuration/resource-definitions/:resourceDefinition/edit',
        title: 'LINSTOR | Storage Configuration | Resource Definitions | Edit',
      },
      {
        component: ResourceList,
        exact: true,
        label: 'resources',
        path: '/storage-configuration/resources',
        title: 'LINSTOR | Storage Configuration | Resources',
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
        component: VolumeList,
        exact: true,
        label: 'volumes',
        path: '/storage-configuration/volumes',
        title: 'LINSTOR | Storage Configuration | Volumes',
      },
    ],
  },
  ...snapshot,
  {
    label: 'remotes & backups',
    routes: [
      {
        component: RemoteList,
        exact: true,
        label: 'remote',
        path: '/remote/list',
        title: 'LINSTOR | Remote | List',
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

const RouteWithTitleUpdates = ({ component: Component, isAsync = false, title, ...rest }: IAppRoute) => {
  useDocumentTitle(title);

  function routeWithTitle(routeProps: RouteComponentProps) {
    return <Component {...rest} {...routeProps} />;
  }

  return <Route render={routeWithTitle} {...rest} />;
};

const PageNotFound = ({ title }: { title: string }) => {
  useDocumentTitle(title);
  return <Route component={NotFound} />;
};

const flattenedRoutes: IAppRoute[] = routes
  .reduce((flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])], [] as IAppRoute[])
  .filter((e) => !e.hide);

const vsanRoutes: IAppRoute[] = [
  {
    component: VSANDashboard,
    path: '/vsan/dashboard',
    title: 'VSAN | Dashboard',
  },
  {
    component: NVMeoF,
    path: '/vsan/nvmeof',
    title: 'VSAN | NVMe-oF',
  },
  {
    component: ISCSI,
    path: '/vsan/iscsi',
    title: 'VSAN | iSCSI',
  },
  {
    component: NFS,
    path: '/vsan/nfs',
    title: 'VSAN | NFS',
  },
  {
    component: UserManagement,
    path: '/vsan/users',
    title: 'VSAN | Users',
  },
  {
    component: NodeDetail,
    exact: true,
    path: '/vsan/nodes/:node',
    title: 'VSAN | Nodes',
  },
  {
    component: PhysicalStorage,
    exact: true,
    path: '/vsan/physical-storage',
    title: 'VSAN | Physical Storage',
  },
  {
    component: ResourceGroup,
    exact: true,
    path: '/vsan/resource-groups',
    title: 'VSAN | Resource Groups',
  },
  {
    component: ErrorReportList,
    exact: true,
    isAsync: true,
    label: 'error_reports',
    path: '/vsan/error-reports',
    title: 'VSAN | Error Reports',
  },
  {
    component: ErrorReportDetail,
    exact: true,
    isAsync: true,
    path: '/error-reports/:id',
    title: 'VSAN | Error Report Detail',
  },
  {
    component: About,
    exact: true,
    path: '/vsan/about',
    title: 'VSAN | About',
  },
];

const adminRoutes = ['/settings', '/users'];

const AppRoutes = (): React.ReactElement => {
  const [displayedRoutes, setDisplayedRoutes] = useState(flattenedRoutes);
  const history = useHistory();

  const { KVS, vsanModeFromSettings, isAdmin } = useSelector((state: RootState) => ({
    KVS: state.setting.KVS,
    vsanModeFromSettings: state.setting.vsanMode,
    isAdmin: state.setting.isAdmin,
  }));

  const dispatch = useDispatch<Dispatch>();

  useEffect(() => {
    const vsanModeFromKVS = KVS?.vsanMode;

    const initialOpenFromVSAN =
      history.location.pathname === '/vsan/dashboard' && history.location.search === '?vsan=true';

    const VSAN_MODE = (vsanModeFromSettings && vsanModeFromKVS) || initialOpenFromVSAN;

    if (VSAN_MODE) {
      setDisplayedRoutes(vsanRoutes);
    } else {
      if (KVS?.authenticationEnabled && !isAdmin) {
        const filteredRoutesForNonAdmin = flattenedRoutes.filter((route) => {
          return !adminRoutes.includes(route.path);
        });
        setDisplayedRoutes(filteredRoutesForNonAdmin);
      } else {
        setDisplayedRoutes(flattenedRoutes);
      }
    }
  }, [dispatch.setting, history, KVS?.vsanMode, vsanModeFromSettings, isAdmin, KVS?.authenticationEnabled]);

  return (
    <Switch>
      {displayedRoutes.map(({ path, exact, component, title, isAsync }, idx) => (
        <RouteWithTitleUpdates
          path={path}
          exact={exact}
          component={component}
          key={idx}
          title={title}
          isAsync={isAsync}
        />
      ))}
      <PageNotFound title="404 Page Not Found" />
    </Switch>
  );
};

export { AppRoutes, routes };
