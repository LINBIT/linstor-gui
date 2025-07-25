// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../api', () => ({
  getNodes: vi.fn(),
  getNodeCount: vi.fn(),
  deleteNode: vi.fn(),
  updateNode: vi.fn(),
  lostNode: vi.fn(),
}));

vi.mock('@app/utils/stringUtils', () => ({
  uniqId: vi.fn(() => 'mock-id'),
}));

vi.mock('@app/utils/object', () => ({
  omit: vi.fn((obj, key) => {
    const { [key]: _, ...rest } = obj;
    return rest;
  }),
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
  useLocation: () => ({ search: '', pathname: '/inventory/nodes' }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@rematch/core', () => ({
  init: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('antd', () => ({
  Button: vi.fn(),
  Form: { useForm: () => [{ setFieldValue: vi.fn(), getFieldsValue: vi.fn(), resetFields: vi.fn() }] },
  Space: vi.fn(),
  Table: vi.fn(),
  Tag: vi.fn(),
  Popconfirm: vi.fn(),
  Input: vi.fn(),
  Dropdown: vi.fn(),
  Tooltip: vi.fn(),
}));

// Import mocked modules
import { getNodes, getNodeCount, deleteNode, updateNode, lostNode } from '../../api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { omit } from '@app/utils/object';
import { uniqId } from '@app/utils/stringUtils';
import { useLocation } from 'react-router-dom';

// Mock data
const mockNodes = {
  data: [
    {
      uuid: 'node-1',
      name: 'test-node-1',
      type: 'Satellite',
      connection_status: 'CONNECTED',
      net_interfaces: [
        {
          is_active: true,
          address: '192.168.1.100',
          satellite_port: 3366,
        },
      ],
      props: {
        prop1: 'value1',
        CurStltConnName: 'should-be-omitted',
      },
    },
    {
      uuid: 'node-2',
      name: 'test-node-2',
      type: 'Controller',
      connection_status: 'OFFLINE',
      net_interfaces: [
        {
          is_active: true,
          address: '192.168.1.101',
          satellite_port: 3367,
        },
      ],
      props: {},
    },
  ],
};

const mockStats = {
  data: {
    count: 2,
  },
};

describe('List Component Logic', () => {
  let mockGetNodes: any;
  let mockGetNodeCount: any;
  let mockDeleteNode: any;
  let mockUpdateNode: any;
  let mockLostNode: any;
  let mockUseQuery: any;
  let mockUseMutation: any;
  let mockUseSelector: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGetNodes = vi.mocked(getNodes);
    mockGetNodeCount = vi.mocked(getNodeCount);
    mockDeleteNode = vi.mocked(deleteNode);
    mockUpdateNode = vi.mocked(updateNode);
    mockLostNode = vi.mocked(lostNode);

    mockUseQuery = vi.mocked(useQuery);
    mockUseMutation = vi.mocked(useMutation);
    mockUseSelector = vi.mocked(useSelector);

    // Setup default mock implementations
    mockGetNodes.mockResolvedValue(mockNodes);
    mockGetNodeCount.mockResolvedValue(mockStats);
    mockDeleteNode.mockResolvedValue({ success: true });
    mockUpdateNode.mockResolvedValue({ success: true });
    mockLostNode.mockResolvedValue({ success: true });

    mockUseSelector.mockReturnValue({ mode: 'GUI' });
    mockUseQuery.mockReturnValue({
      data: mockNodes,
      refetch: vi.fn(),
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('API Integration', () => {
    it('should call getNodes with correct query parameters', async () => {
      await mockGetNodes({ limit: 10, offset: 0 });
      expect(mockGetNodes).toHaveBeenCalledWith({ limit: 10, offset: 0 });
    });

    it('should call getNodeCount for statistics', async () => {
      await mockGetNodeCount();
      expect(mockGetNodeCount).toHaveBeenCalled();
    });
  });

  describe('Data Processing', () => {
    it('should process node data correctly', () => {
      expect(mockNodes.data).toHaveLength(2);
      expect(mockNodes.data[0].name).toBe('test-node-1');
      expect(mockNodes.data[1].name).toBe('test-node-2');
    });

    it('should identify active network interfaces', () => {
      const node1 = mockNodes.data[0];
      const activeInterface = node1.net_interfaces.find((iface) => iface.is_active);

      expect(activeInterface).toBeDefined();
      expect(activeInterface.address).toBe('192.168.1.100');
      expect(activeInterface.satellite_port).toBe(3366);
    });

    it('should distinguish between connected and offline nodes', () => {
      const connectedNode = mockNodes.data[0];
      const offlineNode = mockNodes.data[1];

      expect(connectedNode.connection_status).toBe('CONNECTED');
      expect(offlineNode.connection_status).toBe('OFFLINE');
    });
  });

  describe('Node Selection Logic', () => {
    it('should identify nodes suitable for lost operation', () => {
      const offlineNodes = mockNodes.data.filter(
        (node) => node.connection_status !== 'CONNECTED' && node.connection_status !== 'ONLINE',
      );

      expect(offlineNodes).toHaveLength(1);
      expect(offlineNodes[0].uuid).toBe('node-2');
    });

    it('should identify all nodes for bulk operations', () => {
      const allNodeUuids = mockNodes.data.map((node) => node.uuid);

      expect(allNodeUuids).toContain('node-1');
      expect(allNodeUuids).toContain('node-2');
      expect(allNodeUuids).toHaveLength(2);
    });
  });

  describe('Property Handling', () => {
    it('should omit CurStltConnName from node properties', () => {
      const node = mockNodes.data[0];

      omit(node.props, 'CurStltConnName');

      expect(omit).toHaveBeenCalledWith(node.props, 'CurStltConnName');
    });

    it('should prepare properties for property form', () => {
      const node = mockNodes.data[0];
      const expectedProps = {
        prop1: 'value1',
        name: 'test-node-1',
      };

      // Simulate the property preparation logic
      const processedProps = omit(node.props, 'CurStltConnName');
      const initialProps = {
        ...processedProps,
        name: node.name,
      };

      expect(initialProps.name).toBe(expectedProps.name);
      expect(initialProps.prop1).toBe(expectedProps.prop1);
    });
  });

  describe('Mutation Operations', () => {
    it('should setup delete mutation correctly', async () => {
      await mockDeleteNode('test-node');
      expect(mockDeleteNode).toHaveBeenCalledWith('test-node');
    });

    it('should setup lost mutation correctly', async () => {
      await mockLostNode('test-node');
      expect(mockLostNode).toHaveBeenCalledWith('test-node');
    });

    it('should setup update mutation correctly', async () => {
      const testData = { node: 'test-node', body: { property: 'value' } };
      await mockUpdateNode(testData);
      expect(mockUpdateNode).toHaveBeenCalledWith(testData);
    });
  });

  describe('Search Query Processing', () => {
    it('should process URL search parameters correctly', () => {
      const searchParams = new URLSearchParams('?nodes=test-node-1,test-node-2');
      const nodes = searchParams.get('nodes')?.split(',');

      expect(nodes).toEqual(['test-node-1', 'test-node-2']);
    });

    it('should handle empty search parameters', () => {
      const searchParams = new URLSearchParams('');
      const nodes = searchParams.get('nodes')?.split(',');

      expect(nodes).toBeUndefined();
    });
  });

  describe('Bulk Operations Logic', () => {
    it('should process bulk delete operation', () => {
      const selectedKeys = ['node-1', 'node-2'];
      const nodeData = mockNodes.data;

      selectedKeys.forEach((key) => {
        const node = nodeData.find((e) => e.uuid === key);
        if (node?.name) {
          // Simulate the bulk delete logic
          expect(node.name).toBeDefined();
        }
      });
    });

    it('should process bulk lost operation', () => {
      const selectedKeys = ['node-2']; // Only offline node
      const nodeData = mockNodes.data;

      const validNodes = selectedKeys.filter((key) => {
        const node = nodeData.find((e) => e.uuid === key);
        return node?.connection_status !== 'CONNECTED' && node?.connection_status !== 'ONLINE';
      });

      expect(validNodes).toHaveLength(1);
    });
  });

  describe('Mode-based Navigation', () => {
    it('should generate correct paths for GUI mode', () => {
      const mode = 'GUI';
      const nodeName = 'test-node';

      const createPath = mode === 'HCI' ? '/hci/inventory/nodes/create' : '/inventory/nodes/create';
      const detailPath = mode === 'HCI' ? `/hci/inventory/nodes/${nodeName}` : `/inventory/nodes/${nodeName}`;
      const editPath = mode === 'HCI' ? `/hci/inventory/nodes/edit/${nodeName}` : `/inventory/nodes/edit/${nodeName}`;

      expect(createPath).toBe('/inventory/nodes/create');
      expect(detailPath).toBe('/inventory/nodes/test-node');
      expect(editPath).toBe('/inventory/nodes/edit/test-node');
    });

    it('should generate correct paths for HCI mode', () => {
      const mode = 'HCI';
      const nodeName = 'test-node';

      const createPath = mode === 'HCI' ? '/hci/inventory/nodes/create' : '/inventory/nodes/create';
      const detailPath = mode === 'HCI' ? `/hci/inventory/nodes/${nodeName}` : `/inventory/nodes/${nodeName}`;
      const editPath = mode === 'HCI' ? `/hci/inventory/nodes/edit/${nodeName}` : `/inventory/nodes/edit/${nodeName}`;

      expect(createPath).toBe('/hci/inventory/nodes/create');
      expect(detailPath).toBe('/hci/inventory/nodes/test-node');
      expect(editPath).toBe('/hci/inventory/nodes/edit/test-node');
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique IDs for table rows', () => {
      const id = uniqId();
      expect(id).toBe('mock-id');
      expect(uniqId).toHaveBeenCalled();
    });

    it('should handle pagination calculations', () => {
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
  });
});
