import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CloudServerOutlined,
  ContainerOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  FieldTimeOutlined,
  FileProtectOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
  PieChartOutlined,
  SettingOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { LuDatabaseBackup } from 'react-icons/lu';
import { RiDashboard2Line } from 'react-icons/ri';
import { MdOutlineStorage } from 'react-icons/md';
import { BsHddRack } from 'react-icons/bs';
import { BsNvme } from 'react-icons/bs';
import SVG from 'react-inlinesvg';

import NFS from '@app/assets/nfs.svg';

import { SideMenu } from '../styled';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

interface NavigationProps {
  isNavOpen?: boolean;
  vsanModeFromSetting?: boolean;
  hciModeFromSetting?: boolean;
  KVS?: any;
  gatewayAvailable?: boolean;
  authenticationEnabled?: boolean;
  isAdmin?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  isNavOpen,
  vsanModeFromSetting,
  hciModeFromSetting,
  KVS,
  gatewayAvailable,
  authenticationEnabled,
  isAdmin,
}) => {
  const location = useLocation();
  const { t } = useTranslation(['menu']);
  const [selectedMenu, setSelectedMenu] = React.useState('/dashboard');

  const items: MenuItem[] = React.useMemo(() => {
    if (vsanModeFromSetting) {
      return [
        getItem(<Link to="/vsan/dashboard">Dashboard</Link>, '/vsan/dashboard', <PieChartOutlined />),
        getItem(
          <Link to="/vsan/physical-storage">Physical Storage</Link>,
          '/vsan/physical-storage',
          <MdOutlineStorage />,
        ),
        getItem(
          <Link to="/vsan/resource-groups">Resource Groups</Link>,
          '/vsan/resource-groups',
          <ContainerOutlined />,
        ),
        getItem(<Link to="/vsan/iscsi">iSCSI</Link>, '/vsan/iscsi', <BsHddRack />),
        getItem(<Link to="/vsan/nvmeof">NVMe-oF</Link>, '/vsan/nvmeof', <BsNvme />),
        getItem(<Link to="/vsan/nfs">NFS</Link>, '/vsan/nfs', <SVG src={NFS} width="16" height="16" color="white" />),
        getItem(<Link to="/vsan/error-reports">Error Reports</Link>, '/vsan/error-reports', <WarningOutlined />),
        getItem(<Link to="/vsan/users">Users</Link>, '/vsan/users', <UserOutlined />),
        getItem(<Link to="/vsan/about">About</Link>, '/vsan/about', <InfoCircleOutlined />),
      ];
    } else if (hciModeFromSetting) {
      const hciItems = [
        getItem(<Link to="/hci/dashboard">{t('dashboard')}</Link>, '/hci/dashboard', <PieChartOutlined />),
        getItem(`${t('inventory')}`, '/hci/inventory', <DesktopOutlined />, [
          getItem(<Link to="/hci/inventory/nodes">{t('node')}</Link>, '/hci/inventory/nodes'),
          getItem(<Link to="/hci/inventory/controller">{t('controller')}</Link>, '/hci/inventory/controller'),
          getItem(<Link to="/hci/inventory/storage-pools">{t('storage_pools')}</Link>, '/hci/inventory/storage-pools'),
        ]),
        getItem(`${t('software_defined')}`, '/hci/storage-configuration', <DatabaseOutlined />, [
          getItem(
            <Link to="/hci/storage-configuration/resource-groups">{t('resource_groups')}</Link>,
            '/hci/storage-configuration/resource-groups',
          ),
          getItem(
            <Link to="/hci/storage-configuration/resource-overview">{t('resource_overview')}</Link>,
            '/hci/storage-configuration/resource-overview',
          ),
        ]),
        getItem(`${t('backup&dr')}`, '/hci/backup-and-dr', <LuDatabaseBackup />, [
          getItem(<Link to="/hci/remote/list">{t('remotes')}</Link>, '/hci/remote/list', <CloudServerOutlined />),
          getItem(
            <Link to="/hci/schedule/list-by-resource">{t('schedule_list')}</Link>,
            '/hci/schedule/list-by-resource',
            <FieldTimeOutlined />,
          ),
        ]),

        getItem(<Link to="/hci/snapshot">{t('snapshot')}</Link>, '/hci/snapshot', <FileProtectOutlined />),
        getItem(<Link to="/hci/error-reports">{t('error_reports')}</Link>, '/hci/error-reports', <WarningOutlined />),
      ];

      const settingsAndUsers = [
        getItem(<Link to="/hci/users">{t('users')}</Link>, '/hci/users', <UserOutlined />),
        getItem(<Link to="/hci/settings">{t('settings')}</Link>, '/hci/settings', <SettingOutlined />),
      ];

      const gatewayItems = [
        getItem('Gateway', '/hci/gateway', <NodeIndexOutlined />, [
          getItem(<Link to="/hci/gateway/nfs">NFS</Link>, '/hci/gateway/nfs'),
          getItem(<Link to="/hci/gateway/iscsi">iSCSI</Link>, '/hci/gateway/iscsi'),
          getItem(<Link to="/hci/gateway/nvme-of">NVMe-oF</Link>, '/hci/gateway/nvme-of'),
        ]),
      ];

      const grafanaItem = [
        {
          key: '/hci/grafana',
          label: <Link to="/hci/grafana">Grafana</Link>,
          icon: <RiDashboard2Line />,
        },
      ];

      const itemsRes = [
        ...hciItems,
        ...(KVS?.dashboardEnabled ? grafanaItem : []),
        ...(KVS?.gatewayEnabled && gatewayAvailable ? gatewayItems : []),
        ...(!authenticationEnabled || isAdmin ? settingsAndUsers : []),
      ];

      return itemsRes;
    } else {
      const normalItems = [
        getItem(<Link to="/">{t('dashboard')}</Link>, '/', <PieChartOutlined />),
        getItem(`${t('inventory')}`, '/inventory', <DesktopOutlined />, [
          getItem(<Link to="/inventory/nodes">{t('node')}</Link>, '/inventory/nodes'),
          getItem(<Link to="/inventory/controller">{t('controller')}</Link>, '/inventory/controller'),
          getItem(<Link to="/inventory/storage-pools">{t('storage_pools')}</Link>, '/inventory/storage-pools'),
        ]),
        getItem(`${t('software_defined')}`, '/storage-configuration', <DatabaseOutlined />, [
          getItem(
            <Link to="/storage-configuration/resource-groups">{t('resource_groups')}</Link>,
            '/storage-configuration/resource-groups',
          ),
          getItem(
            <Link to="/storage-configuration/resource-overview">{t('resource_overview')}</Link>,
            '/storage-configuration/resource-overview',
          ),
        ]),
        getItem(`${t('backup&dr')}`, '/backup-and-dr', <LuDatabaseBackup />, [
          getItem(<Link to="/remote/list">{t('remotes')}</Link>, '/remote/list', <CloudServerOutlined />),
          getItem(
            <Link to="/schedule/list-by-resource">{t('schedule_list')}</Link>,
            '/schedule/list-by-resource',
            <FieldTimeOutlined />,
          ),
        ]),

        getItem(<Link to="/snapshot">{t('snapshot')}</Link>, '/snapshot', <FileProtectOutlined />),
        getItem(<Link to="/error-reports">{t('error_reports')}</Link>, '/error-reports', <WarningOutlined />),
      ];

      const settingsAndUsers = [
        getItem(<Link to="/users">{t('users')}</Link>, '/users', <UserOutlined />),
        getItem(<Link to="/settings">{t('settings')}</Link>, '/settings', <SettingOutlined />),
      ];

      const gatewayItems = [
        getItem('Gateway', '/gateway', <NodeIndexOutlined />, [
          getItem(<Link to="/gateway/nfs">NFS</Link>, '/gateway/nfs'),
          getItem(<Link to="/gateway/iscsi">iSCSI</Link>, '/gateway/iscsi'),
          getItem(<Link to="/gateway/nvme-of">NVMe-oF</Link>, '/gateway/nvme-of'),
        ]),
      ];

      const grafanaItem = [
        {
          key: '/grafana',
          label: <Link to="/grafana">Grafana</Link>,
          icon: <RiDashboard2Line />,
        },
      ];

      const itemsRes = [
        ...normalItems,
        ...(KVS?.dashboardEnabled ? grafanaItem : []),
        ...(KVS?.gatewayEnabled && gatewayAvailable ? gatewayItems : []),
        ...(!authenticationEnabled || isAdmin ? settingsAndUsers : []),
      ];

      return itemsRes;
    }
  }, [
    KVS?.dashboardEnabled,
    KVS?.gatewayEnabled,
    authenticationEnabled,
    gatewayAvailable,
    isAdmin,
    t,
    vsanModeFromSetting,
    hciModeFromSetting,
  ]);
  React.useEffect(() => {
    const currentMenu = items.find(
      (e) => e?.key === location.pathname || (e as any)?.children?.find((c: any) => c.key === location.pathname),
    ) as any;

    if (currentMenu?.children) {
      setSelectedMenu(currentMenu.children.find((c: any) => c.key === location.pathname)?.key as string);
    } else {
      setSelectedMenu(currentMenu?.key as string);
    }
  }, [location, items]);

  return (
    <SideMenu>
      <Menu
        defaultSelectedKeys={[selectedMenu]}
        mode="inline"
        theme="dark"
        inlineCollapsed={isNavOpen}
        items={items}
        style={{ backgroundColor: 'transparent' }}
        selectedKeys={[selectedMenu]}
      />
    </SideMenu>
  );
};

export default Navigation;
