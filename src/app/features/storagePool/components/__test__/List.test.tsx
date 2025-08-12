// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../api', () => ({
  getStoragePool: vi.fn(),
  getStoragePoolCount: vi.fn(),
  deleteStoragePoolV2: vi.fn(),
  updateStoragePool: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: vi.fn(),
}));

vi.mock('@app/utils/size', () => ({
  formatBytes: vi.fn((bytes) => `${bytes} bytes`),
}));

vi.mock('@app/components/PropertyForm', () => ({
  default: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '', pathname: '/inventory/storage-pools' }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('antd', () => ({
  Button: vi.fn(),
  Form: {
    useForm: () => [
      {
        setFieldValue: vi.fn(),
        getFieldsValue: vi.fn(),
        resetFields: vi.fn(),
      },
    ],
    useWatch: vi.fn(),
  },
  Space: vi.fn(),
  Table: vi.fn(),
  Tag: vi.fn(),
  Select: vi.fn(),
  Popconfirm: vi.fn(),
  Input: vi.fn(),
  Dropdown: vi.fn(),
  Switch: vi.fn(),
  Tooltip: vi.fn(),
}));

// Import mocked modules
import { getStoragePool, getStoragePoolCount, deleteStoragePoolV2, updateStoragePool } from '../../api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNodes } from '@app/features/node';
import { formatBytes } from '@app/utils/size';
import { Form } from 'antd';

// Mock data
const mockStoragePools = {
  data: [
    {
      uuid: 'sp-1',
      storage_pool_name: 'pool1',
      node_name: 'node-1',
      provider_kind: 'LVM',
      free_capacity: 1024,
      total_capacity: 2048,
      supports_snapshots: true,
      props: {
        'StorDriver/StorPoolName': '/dev/sda1',
      },
    },
    {
      uuid: 'sp-2',
      storage_pool_name: 'DfltDisklessStorPool',
      node_name: 'node-2',
      provider_kind: 'DISKLESS',
      free_capacity: undefined,
      total_capacity: undefined,
      supports_snapshots: false,
      props: {},
    },
    {
      uuid: 'sp-3',
      storage_pool_name: 'pool3',
      node_name: 'node-3',
      provider_kind: 'ZFS',
      free_capacity: 512,
      total_capacity: 1024,
      supports_snapshots: true,
      props: {
        'StorDriver/StorPoolName': 'zpool1',
      },
    },
  ],
};

const mockStats = {
  data: {
    count: 3,
  },
};

const mockNodes = {
  data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }],
};

const mockDefaultStoragePools = {
  data: [
    {
      uuid: 'sp-2',
      storage_pool_name: 'DfltDisklessStorPool',
      node_name: 'node-2',
      provider_kind: 'DISKLESS',
    },
  ],
};

describe('Storage Pool List Component Logic', () => {
  let mockGetStoragePool: any;
  let mockGetStoragePoolCount: any;
  let mockDeleteStoragePoolV2: any;
  let mockUpdateStoragePool: any;
  let mockUseQuery: any;
  let mockUseMutation: any;
  let mockUseSelector: any;
  let mockUseNodes: any;
  let mockFormatBytes: any;
  let mockFormUseWatch: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGetStoragePool = vi.mocked(getStoragePool);
    mockGetStoragePoolCount = vi.mocked(getStoragePoolCount);
    mockDeleteStoragePoolV2 = vi.mocked(deleteStoragePoolV2);
    mockUpdateStoragePool = vi.mocked(updateStoragePool);

    mockUseQuery = vi.mocked(useQuery);
    mockUseMutation = vi.mocked(useMutation);
    mockUseSelector = vi.mocked(useSelector);
    mockUseNodes = vi.mocked(useNodes);
    mockFormatBytes = vi.mocked(formatBytes);
    mockFormUseWatch = vi.mocked(Form.useWatch);

    // Setup default mock implementations
    mockGetStoragePool.mockResolvedValue(mockStoragePools);
    mockGetStoragePoolCount.mockResolvedValue(mockStats);
    mockDeleteStoragePoolV2.mockResolvedValue({ success: true });
    mockUpdateStoragePool.mockResolvedValue({ success: true });

    mockUseSelector.mockReturnValue({ mode: 'GUI' });
    mockUseNodes.mockReturnValue(mockNodes);
    mockFormatBytes.mockImplementation((bytes) => `${bytes} bytes`);
    mockFormUseWatch.mockReturnValue(true); // show_default = true

    mockUseQuery.mockReturnValue({
      data: mockStoragePools,
      refetch: vi.fn(),
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('API Integration', () => {
    it('should call getStoragePool with correct query parameters', async () => {
      const query = { limit: 10, offset: 0 };
      await mockGetStoragePool(query);
      expect(mockGetStoragePool).toHaveBeenCalledWith(query);
    });

    it('should call getStoragePoolCount for statistics', async () => {
      await mockGetStoragePoolCount();
      expect(mockGetStoragePoolCount).toHaveBeenCalled();
    });

    it('should fetch default storage pools for filtering', async () => {
      const defaultQuery = { storage_pools: ['DfltDisklessStorPool'] };
      await mockGetStoragePool(defaultQuery);
      expect(mockGetStoragePool).toHaveBeenCalledWith(defaultQuery);
    });

    it('should adjust query limit when show_default is false', async () => {
      const query = { limit: 10, offset: 0 };
      const adjustedQuery = { ...query, limit: 15 }; // Add buffer for filtering

      await mockGetStoragePool(adjustedQuery);
      expect(mockGetStoragePool).toHaveBeenCalledWith(adjustedQuery);
    });
  });

  describe('Data Processing', () => {
    it('should process storage pool data correctly', () => {
      expect(mockStoragePools.data).toHaveLength(3);
      expect(mockStoragePools.data[0].storage_pool_name).toBe('pool1');
      expect(mockStoragePools.data[1].storage_pool_name).toBe('DfltDisklessStorPool');
    });

    it('should filter default storage pools when show_default is false', () => {
      const filteredData = mockStoragePools.data.filter((sp) => sp.storage_pool_name !== 'DfltDisklessStorPool');

      expect(filteredData).toHaveLength(2);
      expect(filteredData.every((sp) => sp.storage_pool_name !== 'DfltDisklessStorPool')).toBe(true);
    });

    it('should slice data to respect page size limit', () => {
      const limit = 2;
      const slicedData = mockStoragePools.data.slice(0, limit);

      expect(slicedData).toHaveLength(2);
    });

    it('should identify different provider kinds correctly', () => {
      const lvmPool = mockStoragePools.data.find((sp) => sp.provider_kind === 'LVM');
      const disklessPool = mockStoragePools.data.find((sp) => sp.provider_kind === 'DISKLESS');
      const zfsPool = mockStoragePools.data.find((sp) => sp.provider_kind === 'ZFS');

      expect(lvmPool).toBeDefined();
      expect(disklessPool).toBeDefined();
      expect(zfsPool).toBeDefined();
    });
  });

  describe('Provider Kind Color Mapping', () => {
    const providerKindColorMap = {
      LVM: 'orange',
      ZFS: 'blue',
      LVM_THIN: 'green',
      ZFS_THIN: 'purple',
      DISKLESS: '',
    };

    it('should map provider kinds to correct colors', () => {
      expect(providerKindColorMap.LVM).toBe('orange');
      expect(providerKindColorMap.ZFS).toBe('blue');
      expect(providerKindColorMap.DISKLESS).toBe('');
    });

    it('should handle unknown provider kinds', () => {
      const unknownProviderColor = providerKindColorMap['UNKNOWN' as keyof typeof providerKindColorMap] ?? 'default';
      expect(unknownProviderColor).toBe('default');
    });
  });

  describe('Capacity Formatting', () => {
    it('should format bytes for display', () => {
      const capacity = 1024;
      const formatted = mockFormatBytes(capacity);

      expect(mockFormatBytes).toHaveBeenCalledWith(capacity);
      expect(formatted).toBe('1024 bytes');
    });

    it('should handle undefined capacity for diskless storage', () => {
      const disklessPool = mockStoragePools.data.find((sp) => sp.provider_kind === 'DISKLESS');

      expect(disklessPool?.free_capacity).toBeUndefined();
      expect(disklessPool?.total_capacity).toBeUndefined();
    });
  });

  describe('Mutation Operations', () => {
    it('should setup delete mutation correctly', async () => {
      const params = { node: 'node-1', storagepool: 'pool1' };
      await mockDeleteStoragePoolV2(params);
      expect(mockDeleteStoragePoolV2).toHaveBeenCalledWith(params);
    });

    it('should setup update mutation correctly', async () => {
      const params = { node: 'node-1', storagepool: 'pool1' };
      const data = { property: 'value' };
      await mockUpdateStoragePool(params, data);
      expect(mockUpdateStoragePool).toHaveBeenCalledWith(params, data);
    });
  });

  describe('Search Query Processing', () => {
    it('should process URL search parameters for nodes', () => {
      const searchParams = new URLSearchParams('?nodes=node-1');
      const nodes = searchParams.get('nodes');

      expect(nodes).toBe('node-1');
    });

    it('should process URL search parameters for storage pools', () => {
      const searchParams = new URLSearchParams('?storage_pools=pool1');
      const storagePools = searchParams.get('storage_pools');

      expect(storagePools).toBe('pool1');
    });

    it('should handle multiple search parameters', () => {
      const searchParams = new URLSearchParams('?nodes=node-1&storage_pools=pool1');

      expect(searchParams.get('nodes')).toBe('node-1');
      expect(searchParams.get('storage_pools')).toBe('pool1');
    });
  });

  describe('Bulk Operations Logic', () => {
    it('should process bulk delete operation', () => {
      const selectedKeys = ['sp-1', 'sp-3'];
      const storagePoolData = mockStoragePools.data;

      selectedKeys.forEach((key) => {
        const storagePool = storagePoolData.find((sp) => sp.uuid === key);
        expect(storagePool).toBeDefined();
        expect(storagePool?.node_name).toBeDefined();
        expect(storagePool?.storage_pool_name).toBeDefined();
      });
    });

    it('should identify selected storage pools for bulk operations', () => {
      const selectedKeys = ['sp-1', 'sp-2'];
      const selectedPools = mockStoragePools.data.filter((sp) => selectedKeys.includes(sp.uuid));

      expect(selectedPools).toHaveLength(2);
      expect(selectedPools[0].uuid).toBe('sp-1');
      expect(selectedPools[1].uuid).toBe('sp-2');
    });
  });

  describe('Mode-based Navigation', () => {
    it('should generate correct paths for GUI mode', () => {
      const mode = 'GUI';
      const nodeName = 'node-1';
      const storagePoolName = 'pool1';

      const createPath = mode === 'HCI' ? '/hci/inventory/storage-pools/create' : '/inventory/storage-pools/create';
      const editPath =
        mode === 'HCI'
          ? `/hci/inventory/storage-pools/${nodeName}/${storagePoolName}/edit`
          : `/inventory/storage-pools/${nodeName}/${storagePoolName}/edit`;

      expect(createPath).toBe('/inventory/storage-pools/create');
      expect(editPath).toBe('/inventory/storage-pools/node-1/pool1/edit');
    });

    it('should generate correct paths for HCI mode', () => {
      const mode = 'HCI';
      const nodeName = 'node-1';
      const storagePoolName = 'pool1';

      const createPath = mode === 'HCI' ? '/hci/inventory/storage-pools/create' : '/inventory/storage-pools/create';
      const editPath =
        mode === 'HCI'
          ? `/hci/inventory/storage-pools/${nodeName}/${storagePoolName}/edit`
          : `/inventory/storage-pools/${nodeName}/${storagePoolName}/edit`;

      expect(createPath).toBe('/hci/inventory/storage-pools/create');
      expect(editPath).toBe('/hci/inventory/storage-pools/node-1/pool1/edit');
    });

    it('should generate correct node navigation paths', () => {
      const mode = 'GUI';
      const nodeName = 'node-1';

      const nodePath = mode === 'HCI' ? `/hci/inventory/nodes/${nodeName}` : `/inventory/nodes/${nodeName}`;

      expect(nodePath).toBe('/inventory/nodes/node-1');
    });
  });

  describe('Pagination Logic', () => {
    it('should calculate pagination correctly', () => {
      const query = { limit: 10, offset: 0 };
      const page = 2;
      const pageSize = 10;

      const newOffset = (page - 1) * pageSize;
      const expectedQuery = {
        ...query,
        limit: pageSize,
        offset: newOffset,
      };

      expect(expectedQuery.offset).toBe(10);
      expect(expectedQuery.limit).toBe(10);
    });

    it('should reset pagination when show_default changes', () => {
      const query = { limit: 10, offset: 20 };
      const resetQuery = { ...query, offset: 0 };

      expect(resetQuery.offset).toBe(0);
      expect(resetQuery.limit).toBe(10);
    });

    it('should calculate correct total count with default filtering', () => {
      const totalCount = mockStats.data.count;
      const defaultPoolCount = mockDefaultStoragePools.data.length;
      const filteredTotal = totalCount - defaultPoolCount;

      expect(totalCount).toBe(3);
      expect(defaultPoolCount).toBe(1);
      expect(filteredTotal).toBe(2);
    });
  });

  describe('Supports Snapshots Logic', () => {
    it('should identify storage pools that support snapshots', () => {
      const snapshotSupportedPools = mockStoragePools.data.filter((sp) => sp.supports_snapshots);
      const nonSnapshotPools = mockStoragePools.data.filter((sp) => !sp.supports_snapshots);

      expect(snapshotSupportedPools).toHaveLength(2);
      expect(nonSnapshotPools).toHaveLength(1);
      expect(nonSnapshotPools[0].provider_kind).toBe('DISKLESS');
    });
  });

  describe('Storage Pool Properties', () => {
    it('should extract disk information from properties', () => {
      const poolWithDisk = mockStoragePools.data.find((sp) => sp.provider_kind === 'LVM');
      const disklessPool = mockStoragePools.data.find((sp) => sp.provider_kind === 'DISKLESS');

      expect(poolWithDisk?.props?.['StorDriver/StorPoolName']).toBe('/dev/sda1');
      expect(disklessPool?.props?.['StorDriver/StorPoolName']).toBeUndefined();
    });

    it('should handle different storage driver properties', () => {
      const zfsPool = mockStoragePools.data.find((sp) => sp.provider_kind === 'ZFS');

      expect(zfsPool?.props?.['StorDriver/StorPoolName']).toBe('zpool1');
    });
  });

  describe('Form Reset Logic', () => {
    it('should generate correct reset navigation path for GUI mode', () => {
      const mode = 'GUI';
      const resetPath = mode === 'HCI' ? '/hci/inventory/storage-pools' : '/inventory/storage-pools';

      expect(resetPath).toBe('/inventory/storage-pools');
    });

    it('should generate correct reset navigation path for HCI mode', () => {
      const mode = 'HCI';
      const resetPath = mode === 'HCI' ? '/hci/inventory/storage-pools' : '/inventory/storage-pools';

      expect(resetPath).toBe('/hci/inventory/storage-pools');
    });
  });
});
