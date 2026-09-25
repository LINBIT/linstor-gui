import { lazy } from 'react';

const UserManagement = lazy(() => import('@app/features/authentication').then((m) => ({ default: m.UserManagement })));
const ErrorReportList = lazy(() => import('@app/pages/ErrorReport'));
const ErrorReportDetail = lazy(() => import('@app/pages/ErrorReport/Detail'));
const NodeDetail = lazy(() => import('@app/pages/Inventory/Nodes/detail'));
const About = lazy(() => import('@app/pages/VSAN/About').then((m) => ({ default: m.About })));
const ISCSI = lazy(() => import('@app/pages/VSAN/ISCSI').then((m) => ({ default: m.ISCSI })));
const NFS = lazy(() => import('@app/pages/VSAN/NFS').then((m) => ({ default: m.NFS })));
const NVMeoF = lazy(() => import('@app/pages/VSAN/NVMeoF').then((m) => ({ default: m.NVMeoF })));
const PhysicalStorage = lazy(() =>
  import('@app/pages/VSAN/PhysicalStorage').then((m) => ({ default: m.PhysicalStorage })),
);
const ResourceGroup = lazy(() => import('@app/pages/VSAN/ResourceGroup').then((m) => ({ default: m.ResourceGroup })));
const VSANDashboard = lazy(() => import('@app/pages/VSAN/Dashboard').then((m) => ({ default: m.Dashboard })));

const vsan = [
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

export default vsan;
