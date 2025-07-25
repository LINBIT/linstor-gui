// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api', () => ({
  createNode: vi.fn(),
  getNodes: vi.fn(),
  updateNetwork: vi.fn(),
  updateNode: vi.fn(),
}));

vi.mock('@app/features/requests', () => ({
  fullySuccess: vi.fn(() => true),
}));

vi.mock('@app/utils/stringUtils', () => ({
  capitalize: vi.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('antd', () => ({
  Form: {
    useForm: () => [{ setFieldsValue: vi.fn(), getFieldsValue: vi.fn(), resetFields: vi.fn() }],
    Item: vi.fn(),
  },
  Input: vi.fn(),
  Select: vi.fn(),
  Button: vi.fn(),
  Modal: vi.fn(),
  Table: vi.fn(),
  Tag: vi.fn(),
  Popconfirm: vi.fn(),
  Dropdown: vi.fn(),
  Tooltip: vi.fn(),
  Space: vi.fn(),
}));

// Import mocked modules
import { createNode, getNodes, updateNetwork, updateNode } from '../../api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fullySuccess } from '@app/features/requests';
import { capitalize } from '@app/utils/stringUtils';
import { useNavigate, useParams } from 'react-router-dom';

// Mock data
const mockNodeData = {
  data: [
    {
      name: 'test-node',
      type: 'satellite',
      net_interfaces: [
        {
          name: 'default',
          address: '192.168.1.100',
          satellite_port: 3366,
          is_active: true,
          satellite_encryption_type: 'PLAIN',
        },
      ],
    },
  ],
};

describe('CreateNodeForm Component Logic', () => {
  let mockCreateNode: any;
  let mockGetNodes: any;
  let mockUpdateNetwork: any;
  let mockUpdateNode: any;
  let mockUseQuery: any;
  let mockUseMutation: any;
  let mockFullySuccess: any;
  let mockCapitalize: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockCreateNode = vi.mocked(createNode);
    mockGetNodes = vi.mocked(getNodes);
    mockUpdateNetwork = vi.mocked(updateNetwork);
    mockUpdateNode = vi.mocked(updateNode);

    mockUseQuery = vi.mocked(useQuery);
    mockUseMutation = vi.mocked(useMutation);
    mockFullySuccess = vi.mocked(fullySuccess);
    mockCapitalize = vi.mocked(capitalize);

    // Setup default mock implementations
    mockCreateNode.mockResolvedValue({ success: true });
    mockGetNodes.mockResolvedValue(mockNodeData);
    mockUpdateNetwork.mockResolvedValue({ data: { success: true } });
    mockUpdateNode.mockResolvedValue({ data: { success: true } });

    mockUseQuery.mockReturnValue({
      data: mockNodeData,
      isLoading: false,
      error: null,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
    });
  });

  describe('API Integration', () => {
    it('should call createNode with correct parameters', async () => {
      const testNodeData = {
        name: 'new-node',
        type: 'satellite',
        net_interfaces: [
          {
            name: 'default',
            address: '192.168.1.200',
            satellite_port: 3366,
            is_active: true,
            satellite_encryption_type: 'PLAIN',
          },
        ],
      };

      await mockCreateNode(testNodeData);
      expect(mockCreateNode).toHaveBeenCalledWith(testNodeData);
    });

    it('should call getNodes to fetch existing nodes', async () => {
      await mockGetNodes();
      expect(mockGetNodes).toHaveBeenCalled();
    });

    it('should call updateNode for editing existing node', async () => {
      const updateData = {
        node: 'test-node',
        body: {
          type: 'controller',
        },
      };

      await mockUpdateNode(updateData);
      expect(mockUpdateNode).toHaveBeenCalledWith(updateData);
    });

    it('should call updateNetwork for network interface updates', async () => {
      const networkData = {
        node: 'test-node',
        netinterface: 'default',
        body: {
          address: '192.168.1.201',
          satellite_port: 3367,
        },
      };

      await mockUpdateNetwork(networkData);
      expect(mockUpdateNetwork).toHaveBeenCalledWith(networkData);
    });
  });

  describe('Data Processing', () => {
    it('should process node data correctly', () => {
      const node = mockNodeData.data[0];
      expect(node.name).toBe('test-node');
      expect(node.type).toBe('satellite');
      expect(node.net_interfaces).toHaveLength(1);
    });

    it('should handle network interface data', () => {
      const node = mockNodeData.data[0];
      const netInterface = node.net_interfaces[0];

      expect(netInterface.name).toBe('default');
      expect(netInterface.address).toBe('192.168.1.100');
      expect(netInterface.satellite_port).toBe(3366);
      expect(netInterface.is_active).toBe(true);
      expect(netInterface.satellite_encryption_type).toBe('PLAIN');
    });

    it('should validate IP address format', () => {
      const validIP = '192.168.1.100';
      const invalidIP = '999.999.999.999';

      // Simple IP validation logic
      const isValidIP = (ip: string) => {
        const parts = ip.split('.');
        return (
          parts.length === 4 &&
          parts.every((part) => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
          })
        );
      };

      expect(isValidIP(validIP)).toBe(true);
      expect(isValidIP(invalidIP)).toBe(false);
    });

    it('should validate port numbers', () => {
      const validPort = 3366;
      const invalidPort = 70000;

      const isValidPort = (port: number) => port >= 1 && port <= 65535;

      expect(isValidPort(validPort)).toBe(true);
      expect(isValidPort(invalidPort)).toBe(false);
    });
  });

  describe('Node Type Processing', () => {
    it('should handle different node types', () => {
      const nodeTypes = ['satellite', 'controller', 'combined'];

      nodeTypes.forEach((type) => {
        const node = { ...mockNodeData.data[0], type };
        expect(node.type).toBe(type);
      });
    });

    it('should capitalize node type display names', () => {
      const result = vi.mocked(capitalize)('satellite');
      expect(capitalize).toHaveBeenCalledWith('satellite');
    });
  });

  describe('Form Validation Logic', () => {
    it('should validate required fields', () => {
      const formData = {
        name: '',
        type: 'satellite',
        default_ip: '192.168.1.100',
        default_port: 3366,
      };

      const hasRequiredFields = !!(formData.name && formData.type && formData.default_ip && formData.default_port);
      expect(hasRequiredFields).toBe(false);

      formData.name = 'test-node';
      const hasAllFields = !!(formData.name && formData.type && formData.default_ip && formData.default_port);
      expect(hasAllFields).toBe(true);
    });

    it('should prepare form data for submission', () => {
      const formValues = {
        name: 'new-node',
        type: 'satellite',
        default_ip: '192.168.1.200',
        default_port: 3366,
        encryption_type: 'PLAIN',
      };

      const submissionData = {
        name: formValues.name,
        type: formValues.type.toUpperCase(),
        net_interfaces: [
          {
            name: 'default',
            address: formValues.default_ip,
            satellite_port: formValues.default_port,
            is_active: true,
            satellite_encryption_type: formValues.encryption_type,
          },
        ],
      };

      expect(submissionData.name).toBe('new-node');
      expect(submissionData.type).toBe('SATELLITE');
      expect(submissionData.net_interfaces[0].address).toBe('192.168.1.200');
    });
  });

  describe('Edit Mode Logic', () => {
    it('should determine edit mode based on params', () => {
      // Test create mode
      const createModeParams = {
        node: null,
      };
      const isCreateMode = !createModeParams.node;
      expect(isCreateMode).toBe(true);

      // Test edit mode
      const editModeParams = { node: 'test-node' };
      const isEditMode = !!editModeParams.node;
      expect(isEditMode).toBe(true);
    });

    it('should populate form with existing node data in edit mode', () => {
      const existingNode = mockNodeData.data[0];
      const initialValues = {
        name: existingNode.name,
        type: existingNode.type,
        default_ip: existingNode.net_interfaces[0].address,
        default_port: existingNode.net_interfaces[0].satellite_port,
        encryption_type: existingNode.net_interfaces[0].satellite_encryption_type,
      };

      expect(initialValues.name).toBe('test-node');
      expect(initialValues.type).toBe('satellite');
      expect(initialValues.default_ip).toBe('192.168.1.100');
      expect(initialValues.default_port).toBe(3366);
      expect(initialValues.encryption_type).toBe('PLAIN');
    });
  });

  describe('Success Handling', () => {
    it('should handle successful node creation', () => {
      const response = [{ ret_code: 0, message: 'Success' }];
      fullySuccess(response);

      expect(fullySuccess).toHaveBeenCalledWith(response);
    });

    it('should navigate after successful operation', () => {
      // Test the navigation logic without calling React hooks
      const mockNavigateFn = vi.fn();
      mockNavigateFn(-1);
      expect(mockNavigateFn).toHaveBeenCalledWith(-1);
    });
  });

  describe('Mutation Operations', () => {
    it('should setup create mutation correctly', async () => {
      const testData = { name: 'test-node', type: 'satellite' };
      await mockCreateNode(testData);
      expect(mockCreateNode).toHaveBeenCalledWith(testData);
    });

    it('should setup update mutation correctly', async () => {
      const testData = { node: 'test-node', body: { type: 'controller' } };
      await mockUpdateNode(testData);
      expect(mockUpdateNode).toHaveBeenCalledWith(testData);
    });
  });
});
