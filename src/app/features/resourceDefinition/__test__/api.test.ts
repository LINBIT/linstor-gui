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
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  getVolumeDefinitionListByResource,
  updateResourceDefinition,
  cloneResourceDefinition,
  updateVolumeDefinition,
} from '../api';

// Mock data
const mockResourceDefinition = {
  resource_definition_name: 'test-resource-def',
  resource_group_name: 'test-group',
  props: {
    'Aux/description': 'Test resource definition',
    'Aux/environment': 'testing',
  },
};

const mockVolumeDefinition = {
  volume_number: 0,
  size_kib: 2097152,
  props: {
    'StorDriver/StorPoolName': 'test-pool',
  },
};

const mockAutoPlaceRequest = {
  diskless_on_remaining: false,
  select_filter: {
    place_count: 3,
    node_name_list: ['node1', 'node2', 'node3'],
    storage_pool: 'ssd-pool',
  },
};

const mockResourceDefinitionList = {
  data: [
    {
      name: 'resource-def-1',
      resource_group_name: 'group-1',
      props: {
        'Aux/description': 'First resource definition',
      },
      volume_definitions: [
        {
          volume_number: 0,
          size_kib: 1048576,
        },
      ],
    },
    {
      name: 'resource-def-2',
      resource_group_name: 'group-2',
      props: {
        'Aux/description': 'Second resource definition',
      },
      volume_definitions: [],
    },
  ],
};

const mockResourceDefinitionCount = {
  data: {
    count: 15,
  },
};

const mockVolumeDefinitionList = {
  data: [
    {
      volume_number: 0,
      size_kib: 1048576,
      props: {
        'StorDriver/StorPoolName': 'pool1',
      },
    },
    {
      volume_number: 1,
      size_kib: 2097152,
      props: {
        'StorDriver/StorPoolName': 'pool2',
      },
    },
  ],
};

const mockUpdateRequest = {
  override_props: {
    'Aux/description': 'Updated resource definition',
    'Aux/team': 'new-team',
  },
  delete_props: ['Aux/old-property'],
};

const mockCloneRequest = {
  name: 'cloned-resource-def',
  external_name: 'external-clone',
  with_volume_definitions: true,
};

const mockVolumeModifyRequest = {
  override_props: {
    'StorDriver/StorPoolName': 'new-pool',
  },
  delete_props: [],
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

describe('ResourceDefinition API Functions', () => {
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
    mockGet.mockResolvedValue(mockResourceDefinitionList);
    mockPost.mockResolvedValue(mockSuccessResponse);
    mockPut.mockResolvedValue(mockSuccessResponse);
    mockDel.mockResolvedValue(mockSuccessResponse);
  });

  describe('getResourceDefinitionCount', () => {
    it('should call GET endpoint for resource definition statistics', async () => {
      mockGet.mockResolvedValue(mockResourceDefinitionCount);

      await getResourceDefinitionCount();

      expect(mockGet).toHaveBeenCalledWith('/v1/stats/resource-definitions');
    });

    it('should return resource definition count data', async () => {
      mockGet.mockResolvedValue(mockResourceDefinitionCount);

      const result = await getResourceDefinitionCount();

      expect(result).toEqual(mockResourceDefinitionCount);
      expect(result.data.count).toBe(15);
    });

    it('should handle zero resource definitions', async () => {
      mockGet.mockResolvedValue({ data: { count: 0 } });

      const result = await getResourceDefinitionCount();

      expect(result.data.count).toBe(0);
    });
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
      const minimalResourceDef = {
        resource_definition_name: 'minimal-resource-def',
      };

      await createResourceDefinition(minimalResourceDef);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions', {
        body: minimalResourceDef,
      });
    });

    it('should handle creation with complex properties', async () => {
      const complexResourceDef = {
        resource_definition_name: 'complex-resource-def',
        resource_group_name: 'production-group',
        props: {
          'Aux/description': 'Production database resource definition',
          'Aux/team': 'database-team',
          'Aux/environment': 'production',
          'DrbdOptions/auto-promote': 'yes',
          'DrbdOptions/quorum': 'majority',
        },
      };

      await createResourceDefinition(complexResourceDef);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions', {
        body: complexResourceDef,
      });
    });
  });

  describe('createVolumeDefinition', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const resourceName = 'test-resource-def';
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
      const result = await createVolumeDefinition('test-resource-def', mockVolumeDefinition);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle volume definition with encryption', async () => {
      const encryptedVolume = {
        volume_number: 0,
        size_kib: 4194304,
        props: {
          'StorDriver/StorPoolName': 'encrypted-pool',
          'DrbdOptions/encrypt-password': 'volume-encryption-key',
        },
      };

      await createVolumeDefinition('encrypted-resource-def', encryptedVolume);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
        params: {
          path: {
            resource: 'encrypted-resource-def',
          },
        },
        body: encryptedVolume,
      });
    });

    it('should handle multiple volume numbers', async () => {
      const multipleVolumes = [
        { volume_number: 0, size_kib: 1048576 },
        { volume_number: 1, size_kib: 2097152 },
        { volume_number: 2, size_kib: 4194304 },
      ];

      for (const volume of multipleVolumes) {
        await createVolumeDefinition('multi-volume-resource', volume);
      }

      expect(mockPost).toHaveBeenCalledTimes(3);
    });
  });

  describe('autoPlace', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const resourceName = 'test-resource-def';
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
      const result = await autoPlace('test-resource-def', mockAutoPlaceRequest);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle auto place with diskless on remaining nodes', async () => {
      const disklessRequest = {
        diskless_on_remaining: true,
        select_filter: {
          place_count: 2,
          node_name_list: ['node1', 'node2', 'node3', 'node4'],
          storage_pool: 'fast-pool',
        },
      };

      await autoPlace('diskless-resource-def', disklessRequest);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
        params: {
          path: {
            resource: 'diskless-resource-def',
          },
        },
        body: disklessRequest,
      });
    });

    it('should handle auto place with layer selection', async () => {
      const layeredRequest = {
        diskless_on_remaining: false,
        select_filter: {
          place_count: 3,
          layer_stack: ['STORAGE', 'DRBD', 'LUKS'],
          provider_list: ['LVM_THIN'],
        },
      };

      await autoPlace('layered-resource-def', layeredRequest);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
        params: {
          path: {
            resource: 'layered-resource-def',
          },
        },
        body: layeredRequest,
      });
    });
  });

  describe('getResourceDefinition', () => {
    it('should call GET endpoint without query parameters', async () => {
      await getResourceDefinition({});

      expect(mockGet).toHaveBeenCalledWith('/v1/resource-definitions', {
        params: {
          query: {},
        },
      });
    });

    it('should call GET endpoint with query parameters', async () => {
      const query = {
        resource_definitions: ['resource-def-1', 'resource-def-2'],
        props: ['Aux/description'],
        with_volume_definitions: true,
      };

      await getResourceDefinition(query);

      expect(mockGet).toHaveBeenCalledWith('/v1/resource-definitions', {
        params: {
          query,
        },
      });
    });

    it('should return resource definition data', async () => {
      const result = await getResourceDefinition({});

      expect(result).toEqual(mockResourceDefinitionList);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('resource-def-1');
    });

    it('should handle filtered queries', async () => {
      const filteredData = {
        data: [
          {
            name: 'filtered-resource-def',
            resource_group_name: 'filtered-group',
            props: {
              'Aux/environment': 'production',
            },
          },
        ],
      };

      mockGet.mockResolvedValue(filteredData);

      const query = {
        resource_definitions: ['filtered-resource-def'],
      };

      const result = await getResourceDefinition(query);

      expect(result).toEqual(filteredData);
    });
  });

  describe('deleteResourceDefinition', () => {
    it('should call DELETE endpoint with correct path parameter', async () => {
      const resourceName = 'test-resource-def';
      await deleteResourceDefinition(resourceName);

      expect(mockDel).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
        params: {
          path: {
            resource: resourceName,
          },
        },
      });
    });

    it('should handle successful resource definition deletion', async () => {
      const result = await deleteResourceDefinition('test-resource-def');

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle deletion of non-existent resource definition', async () => {
      mockDel.mockResolvedValue({
        data: [
          {
            ret_code: 4,
            message: 'Resource definition not found',
          },
        ],
      });

      const result = await deleteResourceDefinition('non-existent-resource-def');

      expect(result.data[0].ret_code).toBe(4);
    });
  });

  describe('updateResourceDefinition', () => {
    it('should call PUT endpoint with correct path and body', async () => {
      const resourceName = 'test-resource-def';
      await updateResourceDefinition(resourceName, mockUpdateRequest);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
        params: {
          path: {
            resource: resourceName,
          },
        },
        body: mockUpdateRequest,
      });
    });

    it('should handle successful resource definition update', async () => {
      const result = await updateResourceDefinition('test-resource-def', mockUpdateRequest);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle property deletion only', async () => {
      const deleteOnlyRequest = {
        override_props: {},
        delete_props: ['Aux/old-description', 'Aux/deprecated-tag'],
      };

      await updateResourceDefinition('test-resource-def', deleteOnlyRequest);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
        params: {
          path: {
            resource: 'test-resource-def',
          },
        },
        body: deleteOnlyRequest,
      });
    });

    it('should handle property addition only', async () => {
      const addOnlyRequest = {
        override_props: {
          'Aux/new-description': 'Updated description',
          'Aux/version': '2.0',
        },
        delete_props: [],
      };

      await updateResourceDefinition('test-resource-def', addOnlyRequest);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
        params: {
          path: {
            resource: 'test-resource-def',
          },
        },
        body: addOnlyRequest,
      });
    });
  });

  describe('getVolumeDefinitionListByResource', () => {
    it('should call GET endpoint with correct path parameter', async () => {
      const resourceName = 'test-resource-def';
      await getVolumeDefinitionListByResource(resourceName);

      expect(mockGet).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
        params: {
          path: {
            resource: resourceName,
          },
        },
      });
    });

    it('should return volume definition list data', async () => {
      mockGet.mockResolvedValue(mockVolumeDefinitionList);

      const result = await getVolumeDefinitionListByResource('test-resource-def');

      expect(result).toEqual(mockVolumeDefinitionList);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].volume_number).toBe(0);
      expect(result.data[1].volume_number).toBe(1);
    });

    it('should handle empty volume definition list', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await getVolumeDefinitionListByResource('empty-resource-def');

      expect(result.data).toEqual([]);
    });
  });

  describe('cloneResourceDefinition', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const resourceName = 'source-resource-def';
      await cloneResourceDefinition(resourceName, mockCloneRequest);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/clone', {
        params: {
          path: {
            resource: resourceName,
          },
        },
        body: mockCloneRequest,
      });
    });

    it('should handle successful resource definition cloning', async () => {
      const result = await cloneResourceDefinition('source-resource-def', mockCloneRequest);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle cloning without volume definitions', async () => {
      const cloneWithoutVolumes = {
        name: 'cloned-no-volumes',
        external_name: 'external-no-volumes',
        with_volume_definitions: false,
      };

      await cloneResourceDefinition('source-resource-def', cloneWithoutVolumes);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/clone', {
        params: {
          path: {
            resource: 'source-resource-def',
          },
        },
        body: cloneWithoutVolumes,
      });
    });

    it('should handle cloning with custom properties', async () => {
      const cloneWithProps = {
        name: 'cloned-with-props',
        external_name: 'external-with-props',
        with_volume_definitions: true,
        props: {
          'Aux/description': 'Cloned resource definition',
          'Aux/source': 'source-resource-def',
        },
      };

      await cloneResourceDefinition('source-resource-def', cloneWithProps);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/clone', {
        params: {
          path: {
            resource: 'source-resource-def',
          },
        },
        body: cloneWithProps,
      });
    });
  });

  describe('updateVolumeDefinition', () => {
    it('should call PUT endpoint with correct path parameters and body', async () => {
      const resourceName = 'test-resource-def';
      const volumeNumber = 0;
      await updateVolumeDefinition(resourceName, volumeNumber, mockVolumeModifyRequest);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions/{volume_number}', {
        params: {
          path: {
            resource: resourceName,
            volume_number: volumeNumber,
          },
        },
        body: mockVolumeModifyRequest,
      });
    });

    it('should handle successful volume definition update', async () => {
      const result = await updateVolumeDefinition('test-resource-def', 0, mockVolumeModifyRequest);

      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle volume definition size update', async () => {
      const sizeUpdateRequest = {
        override_props: {},
        delete_props: [],
        size_kib: 8388608, // 8GB
      };

      await updateVolumeDefinition('test-resource-def', 1, sizeUpdateRequest);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions/{volume_number}', {
        params: {
          path: {
            resource: 'test-resource-def',
            volume_number: 1,
          },
        },
        body: sizeUpdateRequest,
      });
    });

    it('should handle multiple volume numbers', async () => {
      const volumeNumbers = [0, 1, 2];

      for (const volumeNumber of volumeNumbers) {
        await updateVolumeDefinition('multi-volume-resource', volumeNumber, mockVolumeModifyRequest);
      }

      expect(mockPut).toHaveBeenCalledTimes(3);

      volumeNumbers.forEach((volumeNumber, index) => {
        expect(mockPut).toHaveBeenNthCalledWith(
          index + 1,
          '/v1/resource-definitions/{resource}/volume-definitions/{volume_number}',
          {
            params: {
              path: {
                resource: 'multi-volume-resource',
                volume_number: volumeNumber,
              },
            },
            body: mockVolumeModifyRequest,
          },
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during resource definition creation', async () => {
      mockPost.mockRejectedValue(new Error('API Error'));

      try {
        await createResourceDefinition(mockResourceDefinition);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle network errors during resource definition retrieval', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      try {
        await getResourceDefinition({});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle timeout errors during auto placement', async () => {
      mockPost.mockRejectedValue(new Error('Request timeout'));

      try {
        await autoPlace('timeout-resource-def', mockAutoPlaceRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle permission errors during deletion', async () => {
      mockDel.mockRejectedValue(new Error('Permission denied'));

      try {
        await deleteResourceDefinition('protected-resource-def');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle validation errors during update', async () => {
      mockPut.mockRejectedValue(new Error('Validation failed'));

      try {
        await updateResourceDefinition('invalid-resource-def', mockUpdateRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('API Response Validation', () => {
    it('should handle malformed success responses', async () => {
      const malformedResponse = {
        data: null,
      };

      mockPost.mockResolvedValue(malformedResponse);

      const result = await createResourceDefinition(mockResourceDefinition);
      expect(result).toEqual(malformedResponse);
    });

    it('should handle empty response data', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await getResourceDefinition({});

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
            details: 'Some volumes could not be created',
          },
        ],
      };

      mockPost.mockResolvedValue(partialErrorResponse);

      const result = await createResourceDefinition(mockResourceDefinition);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].ret_code).toBe(0);
      expect(result.data[1].ret_code).toBe(1);
    });

    it('should handle count statistics with additional metadata', async () => {
      const detailedCountResponse = {
        data: {
          count: 25,
          healthy: 20,
          degraded: 3,
          failed: 2,
        },
      };

      mockGet.mockResolvedValue(detailedCountResponse);

      const result = await getResourceDefinitionCount();

      expect(result.data.count).toBe(25);
      expect(result.data.healthy).toBe(20);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete resource definition lifecycle', async () => {
      // Create resource definition
      await createResourceDefinition(mockResourceDefinition);
      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions', {
        body: mockResourceDefinition,
      });

      // Create volume definition
      await createVolumeDefinition('test-resource-def', mockVolumeDefinition);
      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
        params: { path: { resource: 'test-resource-def' } },
        body: mockVolumeDefinition,
      });

      // Auto place
      await autoPlace('test-resource-def', mockAutoPlaceRequest);
      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
        params: { path: { resource: 'test-resource-def' } },
        body: mockAutoPlaceRequest,
      });

      // Update
      await updateResourceDefinition('test-resource-def', mockUpdateRequest);
      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
        params: { path: { resource: 'test-resource-def' } },
        body: mockUpdateRequest,
      });

      // Delete
      await deleteResourceDefinition('test-resource-def');
      expect(mockDel).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
        params: { path: { resource: 'test-resource-def' } },
      });

      expect(mockPost).toHaveBeenCalledTimes(3);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockDel).toHaveBeenCalledTimes(1);
    });

    it('should handle batch operations correctly', async () => {
      const resourceNames = ['batch-resource-1', 'batch-resource-2', 'batch-resource-3'];

      for (const resourceName of resourceNames) {
        await createResourceDefinition({
          resource_definition_name: resourceName,
        });
      }

      expect(mockPost).toHaveBeenCalledTimes(3);

      resourceNames.forEach((resourceName, index) => {
        expect(mockPost).toHaveBeenNthCalledWith(index + 1, '/v1/resource-definitions', {
          body: { resource_definition_name: resourceName },
        });
      });
    });
  });
});
