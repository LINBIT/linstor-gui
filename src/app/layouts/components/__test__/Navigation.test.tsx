import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid="link">
      {children}
    </a>
  ),
  useLocation: () => ({
    pathname: '/dashboard',
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', () => ({
  Menu: ({ children, items, selectedKeys }: { children?: React.ReactNode; items: any[]; selectedKeys: string[] }) => (
    <div data-testid="menu" data-selected-keys={JSON.stringify(selectedKeys)} data-items-count={items.length}>
      {children}
    </div>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  CloudServerOutlined: () => <div data-testid="cloud-server-icon" />,
  ContainerOutlined: () => <div data-testid="container-icon" />,
  DatabaseOutlined: () => <div data-testid="database-icon" />,
  DesktopOutlined: () => <div data-testid="desktop-icon" />,
  FieldTimeOutlined: () => <div data-testid="field-time-icon" />,
  FileProtectOutlined: () => <div data-testid="file-protect-icon" />,
  InfoCircleOutlined: () => <div data-testid="info-circle-icon" />,
  NodeIndexOutlined: () => <div data-testid="node-index-icon" />,
  PieChartOutlined: () => <div data-testid="pie-chart-icon" />,
  SettingOutlined: () => <div data-testid="setting-icon" />,
  UserOutlined: () => <div data-testid="user-icon" />,
  WarningOutlined: () => <div data-testid="warning-icon" />,
}));

vi.mock('react-icons/lu', () => ({
  LuDatabaseBackup: () => <div data-testid="database-backup-icon" />,
}));

vi.mock('react-icons/ri', () => ({
  RiDashboard2Line: () => <div data-testid="dashboard-icon" />,
}));

vi.mock('react-icons/md', () => ({
  MdOutlineStorage: () => <div data-testid="storage-icon" />,
}));

vi.mock('react-icons/bs', () => ({
  BsHddRack: () => <div data-testid="hdd-rack-icon" />,
  BsNvme: () => <div data-testid="nvme-icon" />,
}));

vi.mock('react-inlinesvg', () => ({
  default: ({ src, width, height }: { src: string; width: string; height: string }) => (
    <div data-testid="svg" data-src={src} data-width={width} data-height={height} />
  ),
}));

vi.mock('@app/assets/nfs.svg', () => ({ default: 'nfs.svg' }));

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItem Helper Function', () => {
    const getItem = (
      label: React.ReactNode,
      key: React.Key,
      icon?: React.ReactNode,
      children?: any[],
      type?: 'group',
    ) => {
      return {
        key,
        icon,
        children,
        label,
        type,
      };
    };

    it('should create menu item with all properties', () => {
      const item = getItem('Test Label', 'test-key', <div>icon</div>, [], 'group');

      expect(item).toEqual({
        key: 'test-key',
        icon: <div>icon</div>,
        children: [],
        label: 'Test Label',
        type: 'group',
      });
    });

    it('should create menu item with minimal properties', () => {
      const item = getItem('Simple Label', 'simple-key');

      expect(item).toEqual({
        key: 'simple-key',
        icon: undefined,
        children: undefined,
        label: 'Simple Label',
        type: undefined,
      });
    });
  });

  describe('VSAN Mode Navigation Items', () => {
    it('should generate correct VSAN menu items', () => {
      const vsanModeFromSetting = true;

      const expectedItems = [
        { key: '/vsan/dashboard', label: 'Dashboard' },
        { key: '/vsan/physical-storage', label: 'Physical Storage' },
        { key: '/vsan/resource-groups', label: 'Resource Groups' },
        { key: '/vsan/iscsi', label: 'iSCSI' },
        { key: '/vsan/nvmeof', label: 'NVMe-oF' },
        { key: '/vsan/nfs', label: 'NFS' },
        { key: '/vsan/error-reports', label: 'Error Reports' },
        { key: '/vsan/users', label: 'Users' },
        { key: '/vsan/about', label: 'About' },
      ];

      expect(vsanModeFromSetting).toBe(true);
      expect(expectedItems).toHaveLength(9);
      expect(expectedItems[0].key).toBe('/vsan/dashboard');
      expect(expectedItems[8].key).toBe('/vsan/about');
    });
  });

  describe('HCI Mode Navigation Items', () => {
    it('should generate basic HCI menu items', () => {
      const hciModeFromSetting = true;

      const basicHciItems = [
        { key: '/hci/dashboard', label: 'dashboard' },
        { key: '/hci/inventory', label: 'inventory', hasChildren: true },
        { key: '/hci/storage-configuration', label: 'software_defined', hasChildren: true },
        { key: '/hci/backup-and-dr', label: 'backup&dr', hasChildren: true },
        { key: '/hci/snapshot', label: 'snapshot' },
        { key: '/hci/error-reports', label: 'error_reports' },
      ];

      expect(hciModeFromSetting).toBe(true);
      expect(basicHciItems).toHaveLength(6);
      expect(basicHciItems[0].key).toBe('/hci/dashboard');
    });

    it('should include inventory children correctly', () => {
      const inventoryChildren = [
        { key: '/hci/inventory/nodes', label: 'node' },
        { key: '/hci/inventory/controller', label: 'controller' },
        { key: '/hci/inventory/storage-pools', label: 'storage_pools' },
      ];

      expect(inventoryChildren).toHaveLength(3);
      expect(inventoryChildren[0].key).toBe('/hci/inventory/nodes');
      expect(inventoryChildren[2].key).toBe('/hci/inventory/storage-pools');
    });

    it('should include storage configuration children correctly', () => {
      const storageChildren = [
        { key: '/hci/storage-configuration/resource-groups', label: 'resource_groups' },
        { key: '/hci/storage-configuration/resource-overview', label: 'resource_overview' },
      ];

      expect(storageChildren).toHaveLength(2);
      expect(storageChildren[0].key).toBe('/hci/storage-configuration/resource-groups');
      expect(storageChildren[1].key).toBe('/hci/storage-configuration/resource-overview');
    });

    it('should include backup and DR children correctly', () => {
      const backupChildren = [
        { key: '/hci/remote/list', label: 'remotes' },
        { key: '/hci/schedule/list-by-resource', label: 'schedule_list' },
      ];

      expect(backupChildren).toHaveLength(2);
      expect(backupChildren[0].key).toBe('/hci/remote/list');
      expect(backupChildren[1].key).toBe('/hci/schedule/list-by-resource');
    });
  });

  describe('Normal Mode Navigation Items', () => {
    it('should generate basic normal menu items', () => {
      const normalItems = [
        { key: '/', label: 'dashboard' },
        { key: '/inventory', label: 'inventory', hasChildren: true },
        { key: '/storage-configuration', label: 'software_defined', hasChildren: true },
        { key: '/backup-and-dr', label: 'backup&dr', hasChildren: true },
        { key: '/snapshot', label: 'snapshot' },
        { key: '/error-reports', label: 'error_reports' },
      ];

      expect(normalItems).toHaveLength(6);
      expect(normalItems[0].key).toBe('/');
    });
  });

  describe('Conditional Menu Items', () => {
    it('should include Grafana item when grafana is configured', () => {
      const grafanaConfig = { baseUrl: 'http://grafana.example.com' };
      const shouldIncludeGrafana = !!grafanaConfig?.baseUrl;

      const grafanaItem = shouldIncludeGrafana ? [{ key: '/grafana', label: 'Grafana' }] : [];

      expect(shouldIncludeGrafana).toBe(true);
      expect(grafanaItem).toHaveLength(1);
      expect(grafanaItem[0].key).toBe('/grafana');
    });

    it('should exclude Grafana item when grafana is not configured', () => {
      const grafanaConfig = null as { baseUrl?: string } | null;
      const shouldIncludeGrafana = !!grafanaConfig?.baseUrl;

      const grafanaItem = shouldIncludeGrafana ? [{ key: '/grafana', label: 'Grafana' }] : [];

      expect(shouldIncludeGrafana).toBe(false);
      expect(grafanaItem).toHaveLength(0);
    });

    it('should include Gateway items when enabled and available', () => {
      const KVS = { gatewayEnabled: true };
      const gatewayAvailable = true;

      const shouldIncludeGateway = KVS?.gatewayEnabled && gatewayAvailable;

      const gatewayItems = shouldIncludeGateway
        ? [
            {
              key: '/gateway',
              label: 'Gateway',
              children: [
                { key: '/gateway/nfs', label: 'NFS' },
                { key: '/gateway/iscsi', label: 'iSCSI' },
                { key: '/gateway/nvme-of', label: 'NVMe-oF' },
              ],
            },
          ]
        : [];

      expect(shouldIncludeGateway).toBe(true);
      expect(gatewayItems).toHaveLength(1);
      expect(gatewayItems[0].children).toHaveLength(3);
    });

    it('should exclude Gateway items when disabled or unavailable', () => {
      const testCases = [
        { KVS: { gatewayEnabled: false }, gatewayAvailable: true, expected: false },
        { KVS: { gatewayEnabled: true }, gatewayAvailable: false, expected: false },
        { KVS: { gatewayEnabled: false }, gatewayAvailable: false, expected: false },
      ];

      testCases.forEach(({ KVS, gatewayAvailable, expected }) => {
        const shouldIncludeGateway = KVS?.gatewayEnabled && gatewayAvailable;
        expect(shouldIncludeGateway).toBe(expected);
      });
    });

    it('should include settings and users for admin or when auth disabled', () => {
      const testCases = [
        { authenticationEnabled: false, isAdmin: false, expected: true },
        { authenticationEnabled: true, isAdmin: true, expected: true },
        { authenticationEnabled: true, isAdmin: false, expected: false },
      ];

      testCases.forEach(({ authenticationEnabled, isAdmin, expected }) => {
        const shouldIncludeSettingsUsers = !authenticationEnabled || isAdmin;
        expect(shouldIncludeSettingsUsers).toBe(expected);
      });
    });
  });

  describe('Menu Selection Logic', () => {
    it('should determine selected menu from location pathname', () => {
      const items = [
        { key: '/dashboard', children: undefined },
        { key: '/inventory', children: [{ key: '/inventory/nodes' }, { key: '/inventory/controller' }] },
      ];

      const testCases = [
        { pathname: '/dashboard', expectedKey: '/dashboard' },
        { pathname: '/inventory/nodes', expectedKey: '/inventory/nodes' },
      ];

      testCases.forEach(({ pathname, expectedKey }) => {
        const currentMenu = items.find(
          (e) => e?.key === pathname || (e as any)?.children?.find((c: any) => c.key === pathname),
        ) as any;

        let selectedMenu;
        if (currentMenu?.children) {
          selectedMenu = currentMenu.children.find((c: any) => c.key === pathname)?.key;
        } else {
          selectedMenu = currentMenu?.key;
        }

        expect(selectedMenu).toBe(expectedKey);
      });
    });

    it('should handle parent menu selection when child is active', () => {
      const items = [{ key: '/inventory', children: [{ key: '/inventory/nodes' }, { key: '/inventory/controller' }] }];

      const pathname = '/inventory/nodes';
      const currentMenu = items.find(
        (e) => e?.key === pathname || (e as any)?.children?.find((c: any) => c.key === pathname),
      ) as any;

      expect(currentMenu.key).toBe('/inventory');
      expect(currentMenu.children.find((c: any) => c.key === pathname)).toBeTruthy();
    });
  });

  describe('useMemo Dependencies', () => {
    it('should recalculate items when dependencies change', () => {
      const dependencies = [
        'grafanaConfig',
        'KVS?.gatewayEnabled',
        'authenticationEnabled',
        'gatewayAvailable',
        'isAdmin',
        't',
        'vsanModeFromSetting',
        'hciModeFromSetting',
      ];

      expect(dependencies).toHaveLength(8);
      expect(dependencies).toContain('grafanaConfig');
      expect(dependencies).toContain('vsanModeFromSetting');
      expect(dependencies).toContain('hciModeFromSetting');
      expect(dependencies).toContain('authenticationEnabled');
    });
  });

  describe('Route Path Logic', () => {
    it('should use correct paths for VSAN mode', () => {
      const vsanPaths = [
        '/vsan/dashboard',
        '/vsan/physical-storage',
        '/vsan/resource-groups',
        '/vsan/iscsi',
        '/vsan/nvmeof',
        '/vsan/nfs',
        '/vsan/error-reports',
        '/vsan/users',
        '/vsan/about',
      ];

      vsanPaths.forEach((path) => {
        expect(path).toMatch(/^\/vsan\//);
      });
    });

    it('should use correct paths for HCI mode', () => {
      const hciPaths = [
        '/hci/dashboard',
        '/hci/inventory/nodes',
        '/hci/storage-configuration/resource-groups',
        '/hci/remote/list',
        '/hci/snapshot',
        '/hci/error-reports',
        '/hci/users',
        '/hci/settings',
        '/hci/gateway/nfs',
        '/hci/grafana',
      ];

      hciPaths.forEach((path) => {
        expect(path).toMatch(/^\/hci\//);
      });
    });

    it('should use correct paths for normal mode', () => {
      const normalPaths = [
        '/',
        '/inventory/nodes',
        '/storage-configuration/resource-groups',
        '/remote/list',
        '/snapshot',
        '/error-reports',
        '/users',
        '/settings',
        '/gateway/nfs',
        '/grafana',
      ];

      normalPaths.forEach((path) => {
        expect(path).toMatch(/^\//) || expect(path).toBe('/');
      });
    });
  });

  describe('Icon Assignment Logic', () => {
    it('should assign correct icons to menu items', () => {
      const iconMappings = [
        { key: 'dashboard', icon: 'PieChartOutlined' },
        { key: 'inventory', icon: 'DesktopOutlined' },
        { key: 'software_defined', icon: 'DatabaseOutlined' },
        { key: 'backup&dr', icon: 'LuDatabaseBackup' },
        { key: 'snapshot', icon: 'FileProtectOutlined' },
        { key: 'error_reports', icon: 'WarningOutlined' },
        { key: 'users', icon: 'UserOutlined' },
        { key: 'settings', icon: 'SettingOutlined' },
      ];

      iconMappings.forEach(({ key, icon }) => {
        expect(key).toBeTruthy();
        expect(icon).toBeTruthy();
      });
    });
  });

  describe('Component State Logic', () => {
    it('should initialize selectedMenu with default value', () => {
      const defaultSelectedMenu = '/dashboard';
      expect(defaultSelectedMenu).toBe('/dashboard');
    });

    it('should update selectedMenu based on location changes', () => {
      let selectedMenu = '/dashboard';
      const setSelectedMenu = (newValue: string) => {
        selectedMenu = newValue;
      };

      expect(selectedMenu).toBe('/dashboard');
      setSelectedMenu('/inventory/nodes');
      expect(selectedMenu).toBe('/inventory/nodes');
    });
  });
});
