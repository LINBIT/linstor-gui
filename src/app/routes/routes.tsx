import * as React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { accessibleRouteChangeHandler } from '@app/utils/utils';

import Dashboard from '@app/pages/Dashboard/Dashboard';

import NodeList from '@app/pages/Inventory/Nodes';
import NodeDetail from '@app/pages/Inventory/Nodes/detail';
import NodeCreate from '@app/pages/Inventory/Nodes/create';
import NodeEdit from '@app/pages/Inventory/Nodes/edit';

import StoragePoolList from '@app/pages/Inventory/StoragePools';
import StoragePoolCreate from '@app/pages/Inventory/StoragePools/create';
import StoragePoolEdit from '@app/pages/Inventory/StoragePools/edit';

import NodeIpAddressList from '@app/pages/Inventory/NodeIpAddresses';
import NodeIpAddressCreate from '@app/pages/Inventory/NodeIpAddresses/create';
import IpAddressEdit from '@app/pages/Inventory/NodeIpAddresses/edit';

import ResourceGroupList from '@app/pages/SoftwareDefined/ResourceGroups';
import ResourceGroupCreate from '@app/pages/SoftwareDefined/ResourceGroups/create';
import ResourceGroupEdit from '@app/pages/SoftwareDefined/ResourceGroups/edit';
import ResourceDefinitionList from '@app/pages/SoftwareDefined/ResourceDefinitions';
import ResourceDefinitionCreate from '@app/pages/SoftwareDefined/ResourceDefinitions/create';
import ResourceDefinitionEdit from '@app/pages/SoftwareDefined/ResourceDefinitions/edit';
import ResourceList from '@app/pages/SoftwareDefined/Resources';
import ResourceCreate from '@app/pages/SoftwareDefined/Resources/create';
import ResourceEdit from '@app/pages/SoftwareDefined/Resources/edit';
import VolumeList from '@app/pages/SoftwareDefined/Volumes';
import ErrorReportList from '@app/pages/ErrorReport/index';
import ErrorReportDetail from '@app/pages/ErrorReport/Detail';
import ControllerList from '@app/pages/Inventory/Controller';

import { NotFound } from '@app/pages/NotFound/NotFound';
import GeneralSettings from '@app/pages/Settings/General/GeneralSettings';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

import { LastLocationProvider, useLastLocation } from 'react-router-last-location';
import gateway from './gateway';

let routeFocusTimer: number;

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
    title: 'Linstor | Main Dashboard',
  },
  {
    label: 'inventory',
    routes: [
      {
        component: ControllerList,
        exact: true,
        path: '/controller',
        title: 'Linstor | Inventory | Controller',
      },
      {
        component: NodeList,
        exact: true,
        label: 'node',
        path: '/inventory/nodes',
        title: 'Linstor | Inventory | Nodes',
      },
      {
        component: NodeCreate,
        exact: true,
        path: '/inventory/nodes/create',
        title: 'Linstor | Inventory | Nodes ｜ Create',
      },
      {
        component: NodeDetail,
        exact: true,
        path: '/inventory/nodes/:node',
        title: 'Linstor | Inventory | Nodes',
      },
      {
        component: NodeEdit,
        exact: true,
        path: '/inventory/nodes/edit/:node',
        title: 'Linstor | Inventory | Nodes ｜ Edit',
      },
      {
        component: StoragePoolEdit,
        exact: true,
        path: '/inventory/storage-pools/:node/:storagePool/edit',
        title: 'Linstor | Inventory | Storage Pools',
      },
      {
        component: StoragePoolList,
        exact: true,
        label: 'storage_pools',
        path: '/inventory/storage-pools',
        title: 'Linstor | Inventory | Storage Pools',
      },
      {
        component: StoragePoolCreate,
        exact: true,
        path: '/inventory/storage-pools/create',
        title: 'Linstor | Inventory | Storage Pools',
      },
      {
        component: NodeIpAddressList,
        exact: true,
        label: 'node_ip_addrs',
        path: '/inventory/ip',
        title: 'Linstor | Inventory | Node IP Addresses',
      },
      {
        component: IpAddressEdit,
        exact: true,
        path: '/inventory/ip/:node/:ip/edit',
        title: 'Linstor | Inventory | Node IP Addresses',
      },
      {
        component: NodeIpAddressCreate,
        exact: true,
        path: '/inventory/ip/create',
        title: 'Linstor | Inventory | Node IP Addresses',
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
        path: '/software-defined/resource-groups',
        title: 'Linstor | Software Defined | Resource Groups',
      },
      {
        component: ResourceGroupEdit,
        exact: true,
        path: '/software-defined/resource-groups/:resourceGroup/edit',
        title: 'Linstor | Software Defined | Resource Groups | Edit',
      },
      {
        component: ResourceGroupCreate,
        exact: true,
        path: '/software-defined/resource-groups/create',
        title: 'Linstor | Software Defined | Resource Groups | Create',
      },
      {
        component: ResourceDefinitionList,
        exact: true,
        label: 'resource_definitions',
        path: '/software-defined/resource-definitions',
        title: 'Linstor | Software Defined | Resource Definitions',
      },
      {
        component: ResourceDefinitionCreate,
        exact: true,
        path: '/software-defined/resource-definitions/create',
        title: 'Linstor | Software Defined | Resource Definitions | Create',
      },
      {
        component: ResourceDefinitionEdit,
        exact: true,
        path: '/software-defined/resource-definitions/:resourceDefinition/edit',
        title: 'Linstor | Software Defined | Resource Definitions | Edit',
      },
      {
        component: ResourceList,
        exact: true,
        label: 'resources',
        path: '/software-defined/resources',
        title: 'Linstor | Software Defined | Resources',
      },
      {
        component: ResourceCreate,
        exact: true,
        path: '/software-defined/resources/create',
        title: 'Linstor | Software Defined | Resources | Create',
      },
      {
        component: ResourceEdit,
        exact: true,
        path: '/software-defined/resources/:resource/edit',
        title: 'Linstor | Software Defined | Resources | Edit',
      },
      {
        component: VolumeList,
        exact: true,
        label: 'volumes',
        path: '/software-defined/volumes',
        title: 'Linstor | Software Defined | Volumes',
      },
    ],
  },
  // {
  //   label: 'remotes',
  //   routes: [
  //     {
  //       component: LinstorList,
  //       exact: true,
  //       label: 'linstor',
  //       path: '/remotes/linstor',
  //       title: 'Linstor | Remotes | Linstor',
  //     },
  //   ],
  // },
  ...gateway,
  {
    component: ErrorReportList,
    exact: true,
    isAsync: true,
    label: 'error_reports',
    path: '/error-reports',
    title: 'Linstor | Error Reports',
  },
  {
    component: ErrorReportDetail,
    exact: true,
    isAsync: true,
    path: '/error-reports/:id',
    title: 'Linstor | Error Report Detail',
  },
  {
    component: GeneralSettings,
    exact: true,
    path: '/settings',
    label: 'settings',
    title: 'Linstor | Setting',
  },
];

// a custom hook for sending focus to the primary content container
// after a view has loaded so that subsequent press of tab key
// sends focus directly to relevant content
const useA11yRouteChange = (isAsync: boolean) => {
  const lastNavigation = useLastLocation();
  React.useEffect(() => {
    if (!isAsync && lastNavigation !== null) {
      routeFocusTimer = accessibleRouteChangeHandler();
    }
    return () => {
      window.clearTimeout(routeFocusTimer);
    };
  }, [isAsync, lastNavigation]);
};

const RouteWithTitleUpdates = ({ component: Component, isAsync = false, title, ...rest }: IAppRoute) => {
  useA11yRouteChange(isAsync);
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

const AppRoutes = (): React.ReactElement => (
  <LastLocationProvider>
    <Switch>
      {flattenedRoutes.map(({ path, exact, component, title, isAsync }, idx) => (
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
  </LastLocationProvider>
);

export { AppRoutes, routes };
