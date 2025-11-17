import { UserManagement } from '@app/features/authentication';
import ErrorReportList from '@app/pages/ErrorReport';
import ErrorReportDetail from '@app/pages/ErrorReport/Detail';
import NodeDetail from '@app/pages/Inventory/Nodes/detail';
import { About } from '@app/pages/VSAN/About';
import { ISCSI } from '@app/pages/VSAN/ISCSI';
import { NFS } from '@app/pages/VSAN/NFS';
import { NVMeoF } from '@app/pages/VSAN/NVMeoF';
import { PhysicalStorage } from '@app/pages/VSAN/PhysicalStorage';
import { ResourceGroup } from '@app/pages/VSAN/ResourceGroup';
import { Dashboard as VSANDashboard } from '@app/pages/VSAN/Dashboard';

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
