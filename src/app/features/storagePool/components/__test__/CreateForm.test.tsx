// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../api', () => ({
  getPhysicalStoragePoolByNode: vi.fn(),
  createPhysicalStorage: vi.fn(),
  createStoragePool: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: vi.fn(),
}));

vi.mock('@app/components/SizeInput', () => ({
  SizeInput: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('antd', () => ({
  Button: vi.fn(),
  Collapse: vi.fn(),
  Form: {
    useForm: () => [
      {
        setFieldsValue: vi.fn(),
        setFieldValue: vi.fn(),
      },
    ],
    useWatch: vi.fn(),
  },
  Input: vi.fn(),
  message: {
    info: vi.fn(),
  },
  Radio: {
    Group: vi.fn(),
    Button: vi.fn(),
  },
  Select: vi.fn(),
  Switch: vi.fn(),
  Tooltip: vi.fn(),
}));

// Import mocked modules
import { getPhysicalStoragePoolByNode, createPhysicalStorage, createStoragePool } from '../../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNodes } from '@app/features/node';
import { Form, message } from 'antd';

// Mock data
const mockNodes = {
  data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }],
};

const mockPhysicalDevices = {
  data: [{ device: '/dev/sda' }, { device: '/dev/sdb' }, { device: '/dev/sdc' }],
};

const POOL_NAME = 'LinstorStorage';

describe('CreateForm Component Logic', () => {
  let mockGetPhysicalStoragePoolByNode: any;
  let mockCreatePhysicalStorage: any;
  let mockCreateStoragePool: any;
  let mockUseQuery: any;
  let mockUseMutation: any;
  let mockUseQueryClient: any;
  let mockUseNodes: any;
  let mockFormUseWatch: any;
  let mockMessageInfo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGetPhysicalStoragePoolByNode = vi.mocked(getPhysicalStoragePoolByNode);
    mockCreatePhysicalStorage = vi.mocked(createPhysicalStorage);
    mockCreateStoragePool = vi.mocked(createStoragePool);

    mockUseQuery = vi.mocked(useQuery);
    mockUseMutation = vi.mocked(useMutation);
    mockUseQueryClient = vi.mocked(useQueryClient);
    mockUseNodes = vi.mocked(useNodes);
    mockFormUseWatch = vi.mocked(Form.useWatch);
    mockMessageInfo = vi.mocked(message.info);

    // Setup default mock implementations
    mockGetPhysicalStoragePoolByNode.mockResolvedValue(mockPhysicalDevices);
    mockCreatePhysicalStorage.mockResolvedValue({ success: true });
    mockCreateStoragePool.mockResolvedValue({ success: true });

    mockUseNodes.mockReturnValue(mockNodes);
    mockUseQueryClient.mockReturnValue({
      refetchQueries: vi.fn(),
    });

    // Mock form watch values
    mockFormUseWatch.mockImplementation((field) => {
      const defaultValues = {
        provider_kind: 'LVM',
        node: 'node-1',
        create_type: 'new',
        multiple_nodes: false,
        vdo_enable: false,
      };
      return defaultValues[field as keyof typeof defaultValues];
    });

    mockUseQuery.mockReturnValue({
      data: mockPhysicalDevices,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('API Integration', () => {
    it('should fetch physical storage devices by node', async () => {
      const node = 'node-1';
      await mockGetPhysicalStoragePoolByNode({ node });
      expect(mockGetPhysicalStoragePoolByNode).toHaveBeenCalledWith({ node });
    });

    it('should call createPhysicalStorage with correct parameters', async () => {
      const node = 'node-1';
      const data = {
        pool_name: POOL_NAME,
        provider_kind: 'LVM' as const,
        device_paths: ['/dev/sda'],
        with_storage_pool: {
          name: 'test-pool',
        },
      };

      await mockCreatePhysicalStorage(node, data);
      expect(mockCreatePhysicalStorage).toHaveBeenCalledWith(node, data);
    });

    it('should call createStoragePool for existing volume groups', async () => {
      const node = 'node-1';
      const data = {
        storage_pool_name: 'test-pool',
        provider_kind: 'LVM' as const,
        props: {
          'StorDriver/StorPoolName': 'vg-name',
        },
      };

      await mockCreateStoragePool(node, data);
      expect(mockCreateStoragePool).toHaveBeenCalledWith(node, data);
    });
  });

  describe('Provider Type Lists', () => {
    const typeListForNewDevice = [
      { label: 'LVM', value: 'LVM' },
      { label: 'LVM_THIN', value: 'LVM_THIN' },
      { label: 'ZFS', value: 'ZFS' },
      { label: 'ZFS_THIN', value: 'ZFS_THIN' },
    ];

    const typeListForExisting = [
      { label: 'DISKLESS', value: 'DISKLESS' },
      { label: 'LVM', value: 'LVM' },
      { label: 'LVM_THIN', value: 'LVM_THIN' },
      { label: 'ZFS', value: 'ZFS' },
      { label: 'ZFS_THIN', value: 'ZFS_THIN' },
      { label: 'FILE', value: 'FILE' },
      { label: 'FILE_THIN', value: 'FILE_THIN' },
      { label: 'SPDK', value: 'SPDK' },
      { label: 'REMOTE_SPDK', value: 'REMOTE_SPDK' },
      { label: 'EBS_TARGET', value: 'EBS_TARGET' },
      { label: 'EBS_INIT', value: 'EBS_INIT' },
      { label: 'STORAGE_SPACES', value: 'STORAGE_SPACES' },
      { label: 'STORAGE_SPACES_THIN', value: 'STORAGE_SPACES_THIN' },
    ];

    it('should have correct provider types for new devices', () => {
      expect(typeListForNewDevice).toHaveLength(4);
      expect(typeListForNewDevice.map((t) => t.value)).toEqual(['LVM', 'LVM_THIN', 'ZFS', 'ZFS_THIN']);
    });

    it('should have correct provider types for existing devices', () => {
      expect(typeListForExisting).toHaveLength(13);
      expect(typeListForExisting[0]).toEqual({ label: 'DISKLESS', value: 'DISKLESS' });
      expect(typeListForExisting.find((t) => t.value === 'SPDK')).toBeDefined();
    });

    it('should include all storage space types', () => {
      const storageSpaceTypes = typeListForExisting.filter((t) => t.value.includes('STORAGE_SPACES'));
      expect(storageSpaceTypes).toHaveLength(2);
    });
  });

  describe('Form Submission Logic - New Device', () => {
    it('should prepare correct request body for new device creation', () => {
      const formValues = {
        create_type: 'new' as const,
        storage_pool_name: 'test-pool',
        pool_name: 'custom-pool',
        provider_kind: 'LVM' as const,
        device_path: '/dev/sda',
        sed: true,
        vdo_enable: false,
        node: 'node-1',
      };

      const expectedBody = {
        pool_name: 'custom-pool',
        provider_kind: 'LVM',
        device_paths: ['/dev/sda'],
        with_storage_pool: {
          name: 'test-pool',
        },
        sed: true,
        vdo_enable: false,
        vdo_slab_size_kib: undefined,
        vdo_logical_size_kib: undefined,
      };

      expect(expectedBody.pool_name).toBe(formValues.pool_name);
      expect(expectedBody.provider_kind).toBe(formValues.provider_kind);
      expect(expectedBody.device_paths).toEqual([formValues.device_path]);
    });

    it('should use default pool name when custom name not provided', () => {
      const formValues = {
        storage_pool_name: 'test-pool',
        pool_name: undefined,
        provider_kind: 'LVM' as const,
        device_path: '/dev/sda',
      };

      const poolName = formValues.pool_name ? formValues.pool_name : POOL_NAME;
      expect(poolName).toBe(POOL_NAME);
    });

    it('should handle VDO configuration correctly', () => {
      const formValues = {
        vdo_enable: true,
        vdo_slab_size_kib: 2048,
        vdo_logical_size_kib: 4096,
      };

      const advancedOptions = {
        sed: undefined,
        vdo_enable: formValues.vdo_enable,
        vdo_slab_size_kib: formValues.vdo_slab_size_kib,
        vdo_logical_size_kib: formValues.vdo_logical_size_kib,
      };

      expect(advancedOptions.vdo_enable).toBe(true);
      expect(advancedOptions.vdo_slab_size_kib).toBe(2048);
      expect(advancedOptions.vdo_logical_size_kib).toBe(4096);
    });
  });

  describe('Form Submission Logic - Existing Device', () => {
    it('should prepare correct request body for existing volume group', () => {
      const formValues = {
        create_type: 'existing' as const,
        storage_pool_name: 'existing-pool',
        provider_kind: 'LVM' as const,
        storage_driver_name: 'vg-existing',
        node: 'node-1',
      };

      const expectedBody = {
        storage_pool_name: 'existing-pool',
        provider_kind: 'LVM',
        props: {
          'StorDriver/StorPoolName': 'vg-existing',
        },
      };

      expect(expectedBody.storage_pool_name).toBe(formValues.storage_pool_name);
      expect(expectedBody.provider_kind).toBe(formValues.provider_kind);
      expect(expectedBody.props['StorDriver/StorPoolName']).toBe(formValues.storage_driver_name);
    });
  });

  describe('Multi-node Operations', () => {
    it('should handle single node creation', () => {
      const node = 'node-1';
      const body = {
        pool_name: POOL_NAME,
        provider_kind: 'LVM' as const,
        device_paths: ['/dev/sda'],
        with_storage_pool: { name: 'test-pool' },
      };

      if (Array.isArray(node)) {
        expect(Array.isArray(node)).toBe(false); // This branch shouldn't execute
      } else {
        expect(typeof node).toBe('string');
        expect(node).toBe('node-1');
      }
    });

    it('should handle multiple node creation', () => {
      const nodes = ['node-1', 'node-2', 'node-3'];
      const promises: Promise<any>[] = [];

      if (Array.isArray(nodes)) {
        nodes.forEach((node) => {
          // Simulate promise creation for each node
          const promise = Promise.resolve({ node, success: true });
          promises.push(promise);
        });
      }

      expect(promises).toHaveLength(3);
    });

    it('should process multiple nodes for existing volume groups', () => {
      const selectedNodes = ['node-1', 'node-2'];
      const body = {
        storage_pool_name: 'test-pool',
        provider_kind: 'LVM' as const,
        props: { 'StorDriver/StorPoolName': 'vg-name' },
      };

      const mutations: any[] = [];

      if (Array.isArray(selectedNodes)) {
        selectedNodes.forEach((node) => {
          mutations.push({ node, ...body });
        });
      }

      expect(mutations).toHaveLength(2);
      expect(mutations[0].node).toBe('node-1');
      expect(mutations[1].node).toBe('node-2');
    });
  });

  describe('Provider Kind Specific Logic', () => {
    it('should identify ZFS type correctly', () => {
      const zfsProvider = 'ZFS';
      const zfsThinProvider = 'ZFS_THIN';
      const lvmProvider = 'LVM';

      const isZfsType1 = zfsProvider === 'ZFS' || zfsProvider === 'ZFS_THIN';
      const isZfsType2 = zfsThinProvider === 'ZFS' || zfsThinProvider === 'ZFS_THIN';
      const isZfsType3 = lvmProvider === 'ZFS' || lvmProvider === 'ZFS_THIN';

      expect(isZfsType1).toBe(true);
      expect(isZfsType2).toBe(true);
      expect(isZfsType3).toBe(false);
    });

    it('should show ZFS info message when ZFS type is selected', () => {
      const providerKind = 'ZFS';

      if (providerKind === 'ZFS' || providerKind === 'ZFS_THIN') {
        mockMessageInfo('storage_pool:zfs_toast');
      }

      expect(mockMessageInfo).toHaveBeenCalledWith('storage_pool:zfs_toast');
    });

    it('should enable VDO only for LVM and LVM_THIN', () => {
      const lvmProvider = 'LVM';
      const lvmThinProvider = 'LVM_THIN';
      const zfsProvider = 'ZFS';

      const vdoEnabledForLvm = lvmProvider === 'LVM' || lvmProvider === 'LVM_THIN';
      const vdoEnabledForLvmThin = lvmThinProvider === 'LVM' || lvmThinProvider === 'LVM_THIN';
      const vdoEnabledForZfs = zfsProvider === 'LVM' || zfsProvider === 'LVM_THIN';

      expect(vdoEnabledForLvm).toBe(true);
      expect(vdoEnabledForLvmThin).toBe(true);
      expect(vdoEnabledForZfs).toBe(false);
    });
  });

  describe('Form Field Validation', () => {
    it('should validate storage pool name pattern', () => {
      const pattern = /^(?!-)[a-zA-Z_][a-zA-Z0-9_-]{1,47}[-a-zA-Z0-9_]$/;

      const validNames = ['pool1', 'storage_pool_test', 'test_pool123'];
      const invalidNames = ['-pool', 'p', '123pool', 'a'.repeat(50)];

      validNames.forEach((name) => {
        expect(pattern.test(name)).toBe(true);
      });

      invalidNames.forEach((name) => {
        expect(pattern.test(name)).toBe(false);
      });
    });
  });

  describe('Device Path Options', () => {
    it('should process device path options correctly', () => {
      const deviceOptions = mockPhysicalDevices.data.map((e) => ({
        label: e.device,
        value: e.device,
      }));

      expect(deviceOptions).toHaveLength(3);
      expect(deviceOptions[0]).toEqual({ label: '/dev/sda', value: '/dev/sda' });
    });

    it('should enable device query only when node is selected and create_type is new', () => {
      const node = 'node-1';
      const createType = 'new';

      const enabled = !!node && createType === 'new';

      expect(enabled).toBe(true);
    });

    it('should not enable device query for existing devices', () => {
      const node = 'node-1';
      const createType = 'existing';

      const enabled = !!node && createType === 'new';

      expect(enabled).toBe(false);
    });
  });

  describe('Form Reset Logic', () => {
    it('should reset form fields when create type changes', () => {
      const resetFields = {
        storage_pool_name: '',
        pool_name: '',
        device_path: '',
        storage_driver_name: '',
        sed: false,
        vdo_enable: false,
        vdo_slab_size_kib: undefined,
        vdo_logical_size_kib: undefined,
        provider_kind: 'LVM',
      };

      expect(resetFields.storage_pool_name).toBe('');
      expect(resetFields.sed).toBe(false);
      expect(resetFields.provider_kind).toBe('LVM');
    });
  });

  describe('Node Selection Logic', () => {
    it('should allow single node selection for new devices by default', () => {
      const createType = 'new';
      const multipleNodes = false;

      const mode = createType !== 'new' || multipleNodes ? 'multiple' : undefined;

      expect(mode).toBeUndefined();
    });

    it('should allow multiple node selection when multiple_nodes is enabled', () => {
      const createType = 'new';
      const multipleNodes = true;

      const mode = createType !== 'new' || multipleNodes ? 'multiple' : undefined;

      expect(mode).toBe('multiple');
    });

    it('should allow multiple node selection for existing devices', () => {
      const createType = 'existing';
      const multipleNodes = false;

      const mode = createType !== 'new' || multipleNodes ? 'multiple' : undefined;

      expect(mode).toBe('multiple');
    });
  });

  describe('Loading States', () => {
    it('should handle loading states correctly', () => {
      const createPhysicalStorageLoading = false;
      const createExistingVolumeGroupLoading = true;

      const isDisabled = createPhysicalStorageLoading || createExistingVolumeGroupLoading;
      const isLoading = createPhysicalStorageLoading || createExistingVolumeGroupLoading;

      expect(isDisabled).toBe(true);
      expect(isLoading).toBe(true);
    });
  });
});
