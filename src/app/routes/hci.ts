// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { AppRouteConfig, IAppRoute } from './routes';

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
import { GrafanaDashboard } from '@app/pages/Grafana';
import { Controller } from '@app/pages/Inventory/Controller';
import { UserManagement } from '@app/features/authentication';
import GeneralSettings from '@app/pages/Settings';
import ResourceOverview from '@app/pages/SoftwareDefined/Resources/overview';
import ResourceDefinitionCreate from '@app/pages/SoftwareDefined/ResourceDefinitions/create';
import List from '@app/pages/Snapshot';
import ISCSIList from '@app/pages/Gateway/iscsi';
import ISCSICreate from '@app/pages/Gateway/iscsi/Create';
import NFSList from '@app/pages/Gateway/nfs';
import NFSCreate from '@app/pages/Gateway/nfs/Create';
import NvmeList from '@app/pages/Gateway/nvme';
import NvmeCreate from '@app/pages/Gateway/nvme/Create';
import { HCIDashboard } from '@app/features/hci';

const hci: IAppRoute[] = [
  {
    component: HCIDashboard,
    exact: true,
    path: '/hci/dashboard',
    title: 'LINSTOR | HCI | Main Dashboard',
  },
  {
    component: GrafanaDashboard,
    exact: true,
    path: '/hci/grafana',
    title: 'LINSTOR | HCI | Grafana Dashboard',
    label: 'grafana',
  },
  // Inventory
  {
    component: NodeList,
    exact: true,
    label: 'node',
    path: '/hci/inventory/nodes',
    title: 'LINSTOR | HCI | Inventory | Nodes',
  },
  {
    component: NodeCreate,
    exact: true,
    path: '/hci/inventory/nodes/create',
    title: 'LINSTOR | HCI | Inventory | Nodes | Create',
  },
  {
    component: Controller,
    exact: true,
    path: '/hci/inventory/controller',
    title: 'LINSTOR | HCI | Inventory | Controller',
  },
  {
    component: NodeDetail,
    exact: true,
    path: '/hci/inventory/nodes/:node',
    title: 'LINSTOR | HCI | Inventory | Nodes',
  },
  {
    component: NodeEdit,
    exact: true,
    path: '/hci/inventory/nodes/edit/:node',
    title: 'LINSTOR | HCI | Inventory | Nodes | Edit',
  },
  {
    component: StoragePoolEdit,
    exact: true,
    path: '/hci/inventory/storage-pools/:node/:storagePool/edit',
    title: 'LINSTOR | HCI | Inventory | Storage Pools',
  },
  {
    component: StoragePoolList,
    exact: true,
    label: 'storage_pools',
    path: '/hci/inventory/storage-pools',
    title: 'LINSTOR | HCI | Inventory | Storage Pools',
  },
  {
    component: StoragePoolCreate,
    exact: true,
    path: '/hci/inventory/storage-pools/create',
    title: 'LINSTOR | HCI | Inventory | Storage Pools',
  },
  // Storage Configuration
  {
    component: ResourceGroupList,
    exact: true,
    label: 'resource_groups',
    path: '/hci/storage-configuration/resource-groups',
    title: 'LINSTOR | HCI | Storage Configuration | Resource Groups',
  },
  {
    component: ResourceGroupEdit,
    exact: true,
    path: '/hci/storage-configuration/resource-groups/:resourceGroup/edit',
    title: 'LINSTOR | HCI | Storage Configuration | Resource Groups | Edit',
  },
  {
    component: ResourceGroupCreate,
    exact: true,
    path: '/hci/storage-configuration/resource-groups/create',
    title: 'LINSTOR | HCI | Storage Configuration | Resource Groups | Create',
  },
  {
    component: ResourceOverview,
    exact: true,
    label: 'resource_overview',
    path: '/hci/storage-configuration/resource-overview',
    title: 'LINSTOR | HCI | Storage Configuration | Resource Overview',
  },
  {
    component: ResourceCreate,
    exact: true,
    path: '/hci/storage-configuration/resources/create',
    title: 'LINSTOR | HCI | Storage Configuration | Resources | Create',
  },
  {
    component: ResourceEdit,
    exact: true,
    path: '/hci/storage-configuration/resources/:node/:resource/edit',
    title: 'LINSTOR | HCI | Storage Configuration | Resources | Edit',
  },
  {
    component: ResourceDefinitionCreate,
    exact: true,
    label: 'resource_definition_create',
    path: '/hci/storage-configuration/resource-definitions/create',
    title: 'LINSTOR | HCI | Storage Configuration | Resource Definitions | Create',
  },
  // Snapshot
  {
    component: List,
    exact: true,
    label: 'snapshot',
    path: '/hci/snapshot',
    title: 'LINSTOR | HCI | Snapshot',
  },
  // Backup/DR
  {
    component: RemoteList,
    exact: true,
    label: 'remote',
    path: '/hci/remote/list',
    title: 'LINSTOR | HCI | Remote | List',
  },
  {
    component: ScheduleResource,
    exact: true,
    label: 'schedule',
    path: '/hci/schedule/list-by-resource',
    title: 'LINSTOR | HCI | Schedule | List By Resource',
  },
  {
    component: ScheduleList,
    exact: true,
    label: 'schedule',
    path: '/hci/schedule/list',
    title: 'LINSTOR | HCI | Schedule | List',
  },
  {
    component: BackupList,
    exact: true,
    label: 'backup',
    path: '/hci/remote/:remote_name/backups',
    title: 'LINSTOR | HCI | Remote | BackUp List',
  },
  // Gateway
  {
    component: NFSList,
    exact: true,
    label: 'nfs',
    path: '/hci/gateway/nfs',
    title: 'LINSTOR | HCI | NFS',
  },
  {
    component: NFSCreate,
    exact: true,
    path: '/hci/gateway/nfs/create',
    title: 'LINSTOR | HCI | NFS',
  },
  {
    component: ISCSIList,
    exact: true,
    label: 'iscsi',
    path: '/hci/gateway/iscsi',
    title: 'LINSTOR | HCI | iSCSI',
  },
  {
    component: ISCSICreate,
    exact: true,
    path: '/hci/gateway/iscsi/create',
    title: 'LINSTOR | HCI | iSCSI | Create',
  },
  {
    component: NvmeList,
    exact: true,
    label: 'nvme-of',
    path: '/hci/gateway/nvme-of',
    title: 'LINSTOR | HCI | NVMe-oF',
  },
  {
    component: NvmeCreate,
    exact: true,
    path: '/hci/gateway/nvme-of/create',
    title: 'LINSTOR | HCI | NVMe-oF | Create',
  },
  // Error Reports
  {
    component: ErrorReportList,
    exact: true,
    isAsync: true,
    label: 'error_reports',
    path: '/hci/error-reports',
    title: 'LINSTOR | HCI | Error Reports',
  },
  {
    component: ErrorReportDetail,
    exact: true,
    isAsync: true,
    path: '/hci/error-reports/:id',
    title: 'LINSTOR | HCI | Error Report Detail',
  },
  // Settings
  {
    component: GeneralSettings,
    exact: true,
    path: '/hci/settings',
    label: 'settings',
    title: 'LINSTOR | HCI | Setting',
  },
  // Users
  {
    component: UserManagement,
    exact: true,
    path: '/hci/users',
    label: 'users',
    title: 'LINSTOR | HCI | Users',
  },
];

export default hci;
