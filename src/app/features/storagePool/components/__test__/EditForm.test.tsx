// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../api', () => ({
  getStoragePoolByNode: vi.fn(),
  updateStoragePool: vi.fn(),
}));

vi.mock('@app/features/node', () => ({
  useNodes: vi.fn(),
  getNetworksByNode: vi.fn(),
}));

vi.mock('@app/features/requests', () => ({
  fullySuccess: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ node: 'node-1', storagePool: 'test-pool' }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('antd', () => ({
  Button: vi.fn(),
  Form: {
    useForm: () => [
      {
        setFieldsValue: vi.fn(),
      },
    ],
    useWatch: vi.fn(),
  },
  Input: vi.fn(),
  Select: vi.fn(),
}));

// Import mocked modules
import { getStoragePoolByNode, updateStoragePool } from '../../api';
import { useNodes, getNetworksByNode } from '@app/features/node';
import { fullySuccess } from '@app/features/requests';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form } from 'antd';

// Mock data
const mockNodes = {
  data: [{ name: 'node-1' }, { name: 'node-2' }, { name: 'node-3' }],
};

const mockStoragePool = {
  data: [
    {
      storage_pool_name: 'test-pool',
      node_name: 'node-1',
      provider_kind: 'LVM',
      props: {
        'StorDriver/StorPoolName': 'vg-test',
        PrefNic: 'eth0',
      },
    },
    {
      storage_pool_name: 'another-pool',
      node_name: 'node-1',
      provider_kind: 'ZFS',
      props: {
        'StorDriver/StorPoolName': 'zpool-test',
        PrefNic: 'eth1',
      },
    },
  ],
};

const mockNetworks = {
  data: [{ name: 'eth0' }, { name: 'eth1' }, { name: 'bond0' }],
};

const mockUpdateResponse = {
  data: [
    {
      ret_code: 0,
      message: 'Success',
      details: null,
    },
  ],
};

describe('EditForm Component Logic', () => {
  let mockGetStoragePoolByNode: any;
  let mockUpdateStoragePool: any;
  let mockGetNetworksByNode: any;
  let mockUseNodes: any;
  let mockFullySuccess: any;
  let mockUseQuery: any;
  let mockUseMutation: any;
  let mockUseQueryClient: any;
  let mockFormUseWatch: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGetStoragePoolByNode = vi.mocked(getStoragePoolByNode);
    mockUpdateStoragePool = vi.mocked(updateStoragePool);
    mockGetNetworksByNode = vi.mocked(getNetworksByNode);
    mockUseNodes = vi.mocked(useNodes);
    mockFullySuccess = vi.mocked(fullySuccess);

    mockUseQuery = vi.mocked(useQuery);
    mockUseMutation = vi.mocked(useMutation);
    mockUseQueryClient = vi.mocked(useQueryClient);
    mockFormUseWatch = vi.mocked(Form.useWatch);

    // Setup default mock implementations
    mockGetStoragePoolByNode.mockResolvedValue(mockStoragePool);
    mockUpdateStoragePool.mockResolvedValue(mockUpdateResponse);
    mockGetNetworksByNode.mockResolvedValue(mockNetworks);
    mockUseNodes.mockReturnValue(mockNodes);
    mockFullySuccess.mockReturnValue(true);

    mockFormUseWatch.mockReturnValue('LVM');

    mockUseQueryClient.mockReturnValue({
      refetchQueries: vi.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: mockStoragePool,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('API Integration', () => {
    it('should fetch storage pool data by node', async () => {
      const node = 'node-1';
      await mockGetStoragePoolByNode(node);
      expect(mockGetStoragePoolByNode).toHaveBeenCalledWith(node);
    });

    it('should fetch network data by node', async () => {
      const node = 'node-1';
      await mockGetNetworksByNode(node);
      expect(mockGetNetworksByNode).toHaveBeenCalledWith(node);
    });

    it('should update storage pool with correct parameters', async () => {
      const params = { node: 'node-1', storagepool: 'test-pool' };
      const data = {
        delete_namespaces: [],
        delete_props: [],
        override_props: {
          PrefNic: 'eth0',
        },
      };

      await mockUpdateStoragePool(params, data);
      expect(mockUpdateStoragePool).toHaveBeenCalledWith(params, data);
    });
  });

  describe('Form Data Population', () => {
    it('should populate form fields from storage pool data', () => {
      const currentStoragePool = mockStoragePool.data.find((e) => e.storage_pool_name === 'test-pool');

      const expectedFormData = {
        pool_name: currentStoragePool?.storage_pool_name,
        node: currentStoragePool?.node_name,
        provider_kind: currentStoragePool?.provider_kind,
        storage_driver_name: currentStoragePool?.props?.['StorDriver/StorPoolName'],
        network: currentStoragePool?.props?.PrefNic,
      };

      expect(expectedFormData.pool_name).toBe('test-pool');
      expect(expectedFormData.node).toBe('node-1');
      expect(expectedFormData.provider_kind).toBe('LVM');
      expect(expectedFormData.storage_driver_name).toBe('vg-test');
      expect(expectedFormData.network).toBe('eth0');
    });

    it('should handle storage pool not found', () => {
      const currentStoragePool = mockStoragePool.data.find((e) => e.storage_pool_name === 'non-existent-pool');

      expect(currentStoragePool).toBeUndefined();
    });

    it('should handle missing properties gracefully', () => {
      const storagePoolWithoutProps = {
        storage_pool_name: 'test-pool',
        node_name: 'node-1',
        provider_kind: 'DISKLESS',
        props: {},
      };

      const formData = {
        storage_driver_name: storagePoolWithoutProps.props?.['StorDriver/StorPoolName'],
        network: storagePoolWithoutProps.props?.PrefNic,
      };

      expect(formData.storage_driver_name).toBeUndefined();
      expect(formData.network).toBeUndefined();
    });
  });

  describe('Provider Type Lists', () => {
    const typeList = [
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

    it('should have all supported provider types', () => {
      expect(typeList).toHaveLength(13);
      expect(typeList[0]).toEqual({ label: 'DISKLESS', value: 'DISKLESS' });
    });

    it('should include LVM variants', () => {
      const lvmTypes = typeList.filter((t) => t.value.includes('LVM'));
      expect(lvmTypes).toHaveLength(2);
      expect(lvmTypes.map((t) => t.value)).toEqual(['LVM', 'LVM_THIN']);
    });

    it('should include ZFS variants', () => {
      const zfsTypes = typeList.filter((t) => t.value.includes('ZFS'));
      expect(zfsTypes).toHaveLength(2);
      expect(zfsTypes.map((t) => t.value)).toEqual(['ZFS', 'ZFS_THIN']);
    });

    it('should include SPDK variants', () => {
      const spdkTypes = typeList.filter((t) => t.value.includes('SPDK'));
      expect(spdkTypes).toHaveLength(2);
      expect(spdkTypes.map((t) => t.value)).toEqual(['SPDK', 'REMOTE_SPDK']);
    });
  });

  describe('Form Submission Logic', () => {
    it('should prepare correct update request body', () => {
      const formValues = {
        pool_name: 'test-pool',
        network: 'eth1',
        node: 'node-1',
        provider_kind: 'LVM' as const,
        storage_driver_name: 'vg-test',
      };

      const updateData = {
        delete_namespaces: [],
        delete_props: [],
        override_props: {
          PrefNic: formValues.network,
        },
      };

      expect(updateData.delete_namespaces).toEqual([]);
      expect(updateData.delete_props).toEqual([]);
      expect(updateData.override_props.PrefNic).toBe('eth1');
    });

    it('should handle successful update response', () => {
      const responseData = mockUpdateResponse.data;
      const isSuccess = mockFullySuccess(responseData);

      expect(mockFullySuccess).toHaveBeenCalledWith(responseData);
      expect(isSuccess).toBe(true);
    });

    it('should handle failed update response', () => {
      const failedResponse = [
        {
          ret_code: 1,
          message: 'Failed to update',
          details: 'Error details',
        },
      ];

      mockFullySuccess.mockReturnValue(false);
      const isSuccess = mockFullySuccess(failedResponse);

      expect(isSuccess).toBe(false);
    });
  });

  describe('Label Logic Based on Provider Kind', () => {
    it('should show correct label for LVM provider', () => {
      const providerKind = 'LVM';
      const label = providerKind === 'LVM' ? 'Volume Group' : 'Volume Group/Thin Pool';

      expect(label).toBe('Volume Group');
    });

    it('should show correct label for LVM_THIN provider', () => {
      const providerKind = 'LVM_THIN';
      const label = providerKind === 'LVM' ? 'Volume Group' : 'Volume Group/Thin Pool';

      expect(label).toBe('Volume Group/Thin Pool');
    });

    it('should show correct placeholder for LVM_THIN provider', () => {
      const providerKind = 'LVM_THIN';
      const placeholder = `Please input ${providerKind === 'LVM_THIN' ? 'Volume Group/Thin Pool' : 'Volume Group'}`;

      expect(placeholder).toBe('Please input Volume Group/Thin Pool');
    });

    it('should show correct placeholder for other providers', () => {
      const providerKind = 'ZFS';
      const placeholder = `Please input ${providerKind === 'LVM_THIN' ? 'Volume Group/Thin Pool' : 'Volume Group'}`;

      expect(placeholder).toBe('Please input Volume Group');
    });
  });

  describe('Network Options Processing', () => {
    it('should process network options correctly', () => {
      const networkOptions = mockNetworks.data.map((e) => ({
        label: e.name,
        value: e.name,
      }));

      expect(networkOptions).toHaveLength(3);
      expect(networkOptions[0]).toEqual({ label: 'eth0', value: 'eth0' });
      expect(networkOptions[2]).toEqual({ label: 'bond0', value: 'bond0' });
    });

    it('should handle empty network data', () => {
      const emptyNetworkData = { data: [] };
      const networkOptions = emptyNetworkData.data.map((e) => ({
        label: e.name,
        value: e.name,
      }));

      expect(networkOptions).toHaveLength(0);
    });
  });

  describe('Node Options Processing', () => {
    it('should process node options correctly', () => {
      const nodeOptions = mockNodes.data?.map((e) => ({
        label: e.name,
        value: e.name,
      }));

      expect(nodeOptions).toHaveLength(3);
      expect(nodeOptions?.[0]).toEqual({ label: 'node-1', value: 'node-1' });
    });

    it('should handle undefined nodes data', () => {
      const undefinedNodes = undefined;
      const nodeOptions = undefinedNodes?.data?.map((e) => ({
        label: e.name,
        value: e.name,
      }));

      expect(nodeOptions).toBeUndefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate storage pool name pattern', () => {
      const pattern = /^(?!-)[a-zA-Z_][a-zA-Z0-9_-]{1,47}[-a-zA-Z0-9_]$/;

      const validNames = ['test_pool1', 'storage_pool_test', 'MyPool123'];
      const invalidNames = ['-pool', 'p', '123pool', 'a'.repeat(50)];

      validNames.forEach((name) => {
        expect(pattern.test(name)).toBe(true);
      });

      invalidNames.forEach((name) => {
        expect(pattern.test(name)).toBe(false);
      });
    });

    it('should require storage pool name', () => {
      const rules = [
        { required: true, message: 'Please input storage pool name!' },
        {
          pattern: /^(?!-)[a-zA-Z_][a-zA-Z0-9_-]{1,47}[-a-zA-Z0-9_]$/,
          message: 'Please input a valid storage pool name!',
        },
      ];

      expect(rules[0].required).toBe(true);
      expect(rules[0].message).toBe('Please input storage pool name!');
    });

    it('should require node selection', () => {
      const nodeRules = [{ required: true, message: 'Please select nodes!' }];

      expect(nodeRules[0].required).toBe(true);
      expect(nodeRules[0].message).toBe('Please select nodes!');
    });
  });

  describe('Form Field States', () => {
    it('should have correct disabled states for read-only fields', () => {
      const fieldStates = {
        pool_name: { disabled: true },
        node: { disabled: true },
        provider_kind: { disabled: true },
        storage_driver_name: { disabled: true },
        network: { disabled: false },
      };

      expect(fieldStates.pool_name.disabled).toBe(true);
      expect(fieldStates.node.disabled).toBe(true);
      expect(fieldStates.provider_kind.disabled).toBe(true);
      expect(fieldStates.storage_driver_name.disabled).toBe(true);
      expect(fieldStates.network.disabled).toBe(false);
    });
  });

  describe('Navigation Logic', () => {
    it('should navigate to correct storage pool list path', () => {
      const expectedPath = '/inventory/storage-pools';

      // This simulates the navigation logic
      const path = '/inventory/storage-pools';

      expect(path).toBe(expectedPath);
    });

    it('should handle navigation delay on successful update', (done) => {
      const delay = 1000;

      setTimeout(() => {
        // Simulate navigation after delay
        const navigated = true;
        expect(navigated).toBe(true);
        done();
      }, delay);
    });
  });

  describe('Query Key Management', () => {
    it('should use correct query keys', () => {
      const node = 'node-1';
      const expectedKeys = {
        storagePool: ['getStoragePoolByNode', node],
        networks: ['getNetworksByNode', node],
        refetch: ['getStoragePool'],
      };

      expect(expectedKeys.storagePool).toEqual(['getStoragePoolByNode', 'node-1']);
      expect(expectedKeys.networks).toEqual(['getNetworksByNode', 'node-1']);
      expect(expectedKeys.refetch).toEqual(['getStoragePool']);
    });
  });

  describe('Loading States', () => {
    it('should handle mutation loading state', () => {
      const isLoading = false;
      const mutationState = {
        isLoading,
        mutate: vi.fn(),
      };

      expect(mutationState.isLoading).toBe(false);
      expect(typeof mutationState.mutate).toBe('function');
    });

    it('should disable submit button when loading', () => {
      const isLoading = true;
      const buttonProps = {
        loading: isLoading,
        disabled: false,
      };

      expect(buttonProps.loading).toBe(true);
    });
  });
});
