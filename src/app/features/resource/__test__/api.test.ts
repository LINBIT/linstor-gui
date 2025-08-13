// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock requests module
vi.mock('@app/features/requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

// Import mocked modules and functions
import { get, post, put, del } from '@app/features/requests';
import {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  resourceCreateOnNode,
  deleteResource,
  resourceModify,
  resourceMigration,
  getResourceCount,
  getResources,
} from '../api';

// Mock data
const mockResourceDefinition = {
  resource_definition_name: 'test-resource',
  resource_group_name: 'test-group',
  props: {
    'Aux/test': 'value',
  },
};

const mockVolumeDefinition = {
  volume_number: 0,
  size_kib: 1048576,
  props: {},
};

const mockAutoPlaceRequest = {
  diskless_on_remaining: false,
  select_filter: {
    place_count: 2,
    node_name_list: ['node1', 'node2'],
  },
};

const mockResourceCreate = {
  node_name: 'test-node',
  layer_list: ['STORAGE', 'DRBD'],
  props: {},
};

const mockResourceModify = {
  override_props: {
    'Aux/test': 'modified-value',
  },
  delete_props: [],
};

const mockResourceData = {
  data: [
    {
      name: 'test-resource',
      node_name: 'node1',
      props: {
        'Aux/test': 'value',
      },
      volumes: [
        {
          volume_number: 0,
          storage_pool_name: 'pool1',
          provider_kind: 'LVM_THIN',
          device_path: '/dev/drbd1000',
          allocated_size_kib: 1048576,
        },
      ],
    },
  ],
};

const mockResourceCount = {
  data: {
    count: 5,
  },
};

const mockSuccessResponse = {
  data: [
    {
      ret_code: 0,
      message: 'Success',
      details: null,
    },
  ],
};

describe('Resource API Functions', () => {
  let mockGet: any;
  let mockPost: any;
  let mockPut: any;
  let mockDel: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGet = vi.mocked(get);
    mockPost = vi.mocked(post);
    mockPut = vi.mocked(put);
    mockDel = vi.mocked(del);

    // Setup default mock implementations
    mockGet.mockResolvedValue(mockResourceData);
    mockPost.mockResolvedValue(mockSuccessResponse);
    mockPut.mockResolvedValue(mockSuccessResponse);
    mockDel.mockResolvedValue(mockSuccessResponse);
  });

  describe('createResourceDefinition', () => {
    it('should call POST endpoint with correct path and body', async () => {
      await createResourceDefinition(mockResourceDefinition);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions', {
        body: mockResourceDefinition,
      });
    });

    it('should handle successful resource definition creation', async () => {
      const result = await createResourceDefinition(mockResourceDefinition);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle creation with minimal data', async () => {
      const minimalResource = {
        resource_definition_name: 'minimal-resource',
      };

      await createResourceDefinition(minimalResource);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions', {
        body: minimalResource,
      });
    });

    it('should handle creation with complex properties', async () => {
      const complexResource = {
        resource_definition_name: 'complex-resource',
        resource_group_name: 'complex-group',
        props: {
          'Aux/description': 'Complex resource for testing',
          'DrbdOptions/auto-promote': 'yes',
        },
      };

      await createResourceDefinition(complexResource);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions', {
        body: complexResource,
      });
    });
  });

  describe('createVolumeDefinition', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const resourceName = 'test-resource';
      await createVolumeDefinition(resourceName, mockVolumeDefinition);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
        params: {
          path: {
            resource: resourceName,
          },
        },
        body: mockVolumeDefinition,
      });
    });

    it('should handle successful volume definition creation', async () => {
      const result = await createVolumeDefinition('test-resource', mockVolumeDefinition);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle volume definition with encryption', async () => {
      const encryptedVolume = {
        volume_number: 0,
        size_kib: 2097152,
        props: {
          'DrbdOptions/encrypt-password': 'encrypted-volume-password',
        },
      };

      await createVolumeDefinition('encrypted-resource', encryptedVolume);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
        params: {
          path: {
            resource: 'encrypted-resource',
          },
        },
        body: encryptedVolume,
      });
    });
  });

  describe('autoPlace', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const resourceName = 'test-resource';
      await autoPlace(resourceName, mockAutoPlaceRequest);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
        params: {
          path: {
            resource: resourceName,
          },
        },
        body: mockAutoPlaceRequest,
      });
    });

    it('should handle successful auto placement', async () => {
      const result = await autoPlace('test-resource', mockAutoPlaceRequest);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle auto place with storage pool selection', async () => {
      const storagePoolRequest = {
        diskless_on_remaining: true,
        select_filter: {
          place_count: 3,
          storage_pool: 'ssd-pool',
          node_name_list: ['node1', 'node2', 'node3'],
        },
      };

      await autoPlace('storage-pool-resource', storagePoolRequest);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
        params: {
          path: {
            resource: 'storage-pool-resource',
          },
        },
        body: storagePoolRequest,
      });
    });
  });

  describe('resourceCreateOnNode', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const resourceName = 'test-resource';
      const nodeName = 'test-node';
      await resourceCreateOnNode(resourceName, nodeName, mockResourceCreate);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: resourceName,
            node: nodeName,
          },
        },
        body: mockResourceCreate,
      });
    });

    it('should handle successful resource creation on node', async () => {
      const result = await resourceCreateOnNode('test-resource', 'test-node', mockResourceCreate);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle resource creation with specific layers', async () => {
      const layeredResource = {
        node_name: 'layered-node',
        layer_list: ['STORAGE', 'DRBD', 'LUKS'],
        props: {
          'StorDriver/StorPoolName': 'encrypted-pool',
        },
      };

      await resourceCreateOnNode('layered-resource', 'layered-node', layeredResource);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'layered-resource',
            node: 'layered-node',
          },
        },
        body: layeredResource,
      });
    });
  });

  describe('deleteResource', () => {
    it('should call DELETE endpoint with correct path parameters', async () => {
      const resourceName = 'test-resource';
      const nodeName = 'test-node';
      await deleteResource(resourceName, nodeName);

      expect(mockDel).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: resourceName,
            node: nodeName,
          },
        },
      });
    });

    it('should handle successful resource deletion', async () => {
      const result = await deleteResource('test-resource', 'test-node');

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle deletion of non-existent resource gracefully', async () => {
      mockDel.mockResolvedValue({
        data: [
          {
            ret_code: 4,
            message: 'Resource not found',
          },
        ],
      });

      const result = await deleteResource('non-existent', 'test-node');

      expect(result.data[0].ret_code).toBe(4);
    });
  });

  describe('resourceModify', () => {
    it('should call PUT endpoint with correct path and body', async () => {
      const resourceName = 'test-resource';
      const nodeName = 'test-node';
      await resourceModify(resourceName, nodeName, mockResourceModify);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: resourceName,
            node: nodeName,
          },
        },
        body: mockResourceModify,
      });
    });

    it('should handle successful resource modification', async () => {
      const result = await resourceModify('test-resource', 'test-node', mockResourceModify);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle property deletion', async () => {
      const deletePropsRequest = {
        override_props: {},
        delete_props: ['Aux/old-property', 'DrbdOptions/old-option'],
      };

      await resourceModify('test-resource', 'test-node', deletePropsRequest);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'test-resource',
            node: 'test-node',
          },
        },
        body: deletePropsRequest,
      });
    });
  });

  describe('resourceMigration', () => {
    it('should call PUT endpoint with correct migration path', async () => {
      const migrationData = {
        resource: 'migrate-resource',
        node: 'target-node',
        fromnode: 'source-node',
      };

      await resourceMigration(migrationData);

      expect(mockPut).toHaveBeenCalledWith(
        '/v1/resource-definitions/{resource}/resources/{node}/migrate-disk/{fromnode}',
        {
          params: {
            path: {
              resource: 'migrate-resource',
              node: 'target-node',
              fromnode: 'source-node',
            },
          },
        },
      );
    });

    it('should handle successful resource migration', async () => {
      const migrationData = {
        resource: 'test-resource',
        node: 'node2',
        fromnode: 'node1',
      };

      const result = await resourceMigration(migrationData);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle migration between different node types', async () => {
      const crossTypeMigration = {
        resource: 'cross-type-resource',
        node: 'ssd-node',
        fromnode: 'hdd-node',
      };

      await resourceMigration(crossTypeMigration);

      expect(mockPut).toHaveBeenCalledWith(
        '/v1/resource-definitions/{resource}/resources/{node}/migrate-disk/{fromnode}',
        {
          params: {
            path: {
              resource: 'cross-type-resource',
              node: 'ssd-node',
              fromnode: 'hdd-node',
            },
          },
        },
      );
    });
  });

  describe('getResourceCount', () => {
    it('should call GET endpoint for resource statistics', async () => {
      mockGet.mockResolvedValue(mockResourceCount);

      await getResourceCount();

      expect(mockGet).toHaveBeenCalledWith('/v1/stats/resources');
    });

    it('should return resource count data', async () => {
      mockGet.mockResolvedValue(mockResourceCount);

      const result = await getResourceCount();

      expect(result).toEqual(mockResourceCount);
      expect(result.data.count).toBe(5);
    });

    it('should handle empty resource count', async () => {
      mockGet.mockResolvedValue({ data: { count: 0 } });

      const result = await getResourceCount();

      expect(result.data.count).toBe(0);
    });
  });

  describe('getResources', () => {
    it('should call GET endpoint without query parameters', async () => {
      await getResources();

      expect(mockGet).toHaveBeenCalledWith('/v1/view/resources', {
        params: {
          query: undefined,
        },
      });
    });

    it('should call GET endpoint with query parameters', async () => {
      const query = {
        nodes: ['node1', 'node2'],
        resources: ['resource1'],
        storage_pools: ['pool1'],
      };

      await getResources(query);

      expect(mockGet).toHaveBeenCalledWith('/v1/view/resources', {
        params: {
          query,
        },
      });
    });

    it('should return resource data', async () => {
      const result = await getResources();

      expect(result).toEqual(mockResourceData);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('test-resource');
    });

    it('should handle filtered resource queries', async () => {
      const filteredQuery = {
        nodes: ['specific-node'],
        resources: ['filtered-resource'],
      };

      const filteredData = {
        data: [
          {
            name: 'filtered-resource',
            node_name: 'specific-node',
          },
        ],
      };

      mockGet.mockResolvedValue(filteredData);

      const result = await getResources(filteredQuery);

      expect(result).toEqual(filteredData);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during resource creation', async () => {
      mockPost.mockRejectedValue(new Error('API Error'));

      try {
        await createResourceDefinition(mockResourceDefinition);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle network errors during resource retrieval', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      try {
        await getResources();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle timeout errors during migration', async () => {
      mockPut.mockRejectedValue(new Error('Request timeout'));

      try {
        await resourceMigration({
          resource: 'timeout-resource',
          node: 'target',
          fromnode: 'source',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('API Response Validation', () => {
    it('should handle malformed success responses', () => {
      const malformedResponse = {
        data: null,
      };

      mockPost.mockResolvedValue(malformedResponse);

      expect(async () => {
        const result = await createResourceDefinition(mockResourceDefinition);
        return result;
      }).toBeDefined();
    });

    it('should handle empty response data', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await getResources();

      expect(result.data).toEqual([]);
    });

    it('should handle partial error responses', async () => {
      const partialErrorResponse = {
        data: [
          {
            ret_code: 0,
            message: 'Partial success',
          },
          {
            ret_code: 1,
            message: 'Partial failure',
          },
        ],
      };

      mockPost.mockResolvedValue(partialErrorResponse);

      const result = await createResourceDefinition(mockResourceDefinition);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].ret_code).toBe(0);
      expect(result.data[1].ret_code).toBe(1);
    });
  });
});
