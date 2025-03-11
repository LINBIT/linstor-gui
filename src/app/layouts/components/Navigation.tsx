import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  AppstoreOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  FileProtectOutlined,
  InfoCircleOutlined,
  MailOutlined,
  NodeIndexOutlined,
  PieChartOutlined,
  SettingOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
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
  KVS?: any;
  gatewayAvailable?: boolean;
  authenticationEnabled?: boolean;
  isAdmin?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  isNavOpen,
  vsanModeFromSetting,
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
          <DesktopOutlined />,
        ),
        getItem(
          <Link to="/vsan/resource-groups">Resource Groups</Link>,
          '/vsan/resource-groups',
          <ContainerOutlined />,
        ),
        getItem(<Link to="/vsan/iscsi">iSCSI</Link>, '/vsan/iscsi', <MailOutlined />),
        getItem(<Link to="/vsan/nvmeof">NVMe-oF</Link>, '/vsan/nvmeof', <AppstoreOutlined />),
        getItem(<Link to="/vsan/nfs">NFS</Link>, '/vsan/nfs', <CloudServerOutlined />),
        getItem(<Link to="/vsan/error-reports">Error Reports</Link>, '/vsan/error-reports', <WarningOutlined />),
        getItem(<Link to="/vsan/users">Users</Link>, '/vsan/users', <UserOutlined />),
        getItem(<Link to="/vsan/about">About</Link>, '/vsan/about', <InfoCircleOutlined />),
      ];
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
        getItem(<Link to="/remote/list">{t('remotes')}</Link>, '/remote/list', <CloudServerOutlined />),
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
          icon: <PieChartOutlined />,
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
  ]);

  React.useEffect(() => {
    const currentMenu = items.find(
      (e) => e?.key === location.pathname || (e as any)?.children?.find((c) => c.key === location.pathname),
    ) as any;

    if (currentMenu?.children) {
      setSelectedMenu(currentMenu.children.find((c) => c.key === location.pathname)?.key as string);
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
