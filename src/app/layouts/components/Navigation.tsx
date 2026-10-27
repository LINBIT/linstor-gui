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
  FileOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  NodeIndexOutlined,
  PieChartOutlined,
  SafetyOutlined,
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
import { GrafanaConfig } from '@app/features/settings/types';
import { useLinstorVersion, MIN_API_VERSION } from '@app/hooks';

type MenuItem = Required<MenuProps>['items'][number];

interface KVSSettings {
  gatewayEnabled?: boolean;
}

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
  KVS?: KVSSettings;
  grafanaConfig?: GrafanaConfig | null;
  gatewayAvailable?: boolean;
  authenticationEnabled?: boolean;
  isAdmin?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  isNavOpen,
  vsanModeFromSetting,
  hciModeFromSetting,
  KVS,
  grafanaConfig,
  gatewayAvailable,
  authenticationEnabled,
  isAdmin,
}) => {
  const location = useLocation();
  const { t } = useTranslation(['menu']);
  const [selectedMenu, setSelectedMenu] = React.useState('');
  const [openKeys, setOpenKeys] = React.useState<string[]>([]);
  const { isFetched: versionFetched, hasMinVersion } = useLinstorVersion();
  // While the version is still loading we optimistically show the gated items
  // so they don't briefly disappear on a fresh page load. Once we know the
  // controller version, hide them if the API is too old.
  const haAvailable = !versionFetched || hasMinVersion(MIN_API_VERSION.HA);
  const authTokensAvailable = !versionFetched || hasMinVersion(MIN_API_VERSION.AUTH_TOKENS);

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
        getItem(
          <Link to="/vsan/nfs">NFS</Link>,
          '/vsan/nfs',
          <SVG src={NFS} width="16" height="16" className="text-(--icon-default)" />,
        ),
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
        getItem(<Link to="/hci/files">{t('files')}</Link>, '/hci/files', <FileOutlined />),
        getItem(<Link to="/hci/error-reports">{t('error_reports')}</Link>, '/hci/error-reports', <WarningOutlined />),
      ];

      const settingsAndUsers = [
        getItem(`${t('authentication')}`, '/hci/authentication', <UserOutlined />, [
          getItem(<Link to="/hci/users">{t('users')}</Link>, '/hci/users'),
        ]),
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
        ...(grafanaConfig?.baseUrl ? grafanaItem : []),
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

        ...(haAvailable
          ? [
              getItem(`${t('high_availability')}`, '/high-availability', <SafetyOutlined />, [
                getItem(<Link to="/reactor">{t('reactor')}</Link>, '/reactor'),
                getItem(<Link to="/files">{t('files')}</Link>, '/files'),
              ]),
            ]
          : []),
        getItem(<Link to="/snapshot">{t('snapshot')}</Link>, '/snapshot', <FileProtectOutlined />),
        getItem(<Link to="/error-reports">{t('error_reports')}</Link>, '/error-reports', <WarningOutlined />),
      ];

      const settingsAndUsers = [
        getItem(`${t('authentication')}`, '/authentication', <KeyOutlined />, [
          getItem(<Link to="/users">{t('users')}</Link>, '/users'),
          ...(authTokensAvailable ? [getItem(<Link to="/auth-tokens">{t('auth_tokens')}</Link>, '/auth-tokens')] : []),
        ]),
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
        ...(grafanaConfig?.baseUrl ? grafanaItem : []),
        ...(KVS?.gatewayEnabled && gatewayAvailable ? gatewayItems : []),
        ...(!authenticationEnabled || isAdmin ? settingsAndUsers : []),
      ];

      return itemsRes;
    }
  }, [
    grafanaConfig,
    KVS?.gatewayEnabled,
    authenticationEnabled,
    gatewayAvailable,
    isAdmin,
    t,
    vsanModeFromSetting,
    hciModeFromSetting,
    haAvailable,
    authTokensAvailable,
  ]);
  // Select the entry for the current page and open its group. A page below an
  // entry (a node's detail page, a create or edit form) belongs to the entry
  // whose path is the longest prefix of it; a page under no entry selects none.
  React.useEffect(() => {
    const covers = (key: string) =>
      key === location.pathname || (key !== '/' && location.pathname.startsWith(`${key}/`));

    type Entry = { key: string; parent?: string };
    const entries = items.flatMap((item): Entry[] => {
      if (!item || !('key' in item)) return [];
      if ('children' in item && Array.isArray(item.children)) {
        return item.children.flatMap((child): Entry[] =>
          child && 'key' in child ? [{ key: child.key as string, parent: item.key as string }] : [],
        );
      }
      return [{ key: item.key as string }];
    });
    const match = entries
      .filter((entry) => covers(entry.key))
      .reduce<Entry | undefined>(
        (best, entry) => (best && best.key.length >= entry.key.length ? best : entry),
        undefined,
      );

    setSelectedMenu(match?.key ?? '');
    // Groups follow the page only while the sidebar is expanded, and a page
    // under no entry leaves the open groups as they are.
    if (match && !isNavOpen) {
      setOpenKeys(match.parent ? [match.parent] : []);
    }
  }, [location.pathname, items, isNavOpen]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <div className="[&_.ant-menu.ant-menu-sub.ant-menu-inline]:[background:none]">
      <Menu
        mode="inline"
        theme="light"
        inlineCollapsed={isNavOpen}
        items={items}
        className="bg-transparent"
        selectedKeys={selectedMenu ? [selectedMenu] : []}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default Navigation;
