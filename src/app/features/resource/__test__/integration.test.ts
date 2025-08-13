// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@app/features/requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@app/utils/resource', () => ({
  getFaultyResources: vi.fn(),
  getHealthyResources: vi.fn(),
  isResourceHealthy: vi.fn(),
  calculateResourceStatus: vi.fn(),
}));

// Import after mocks
import { get, post, put, del } from '@app/features/requests';
import { getResources, resourceCreateOnNode, resourceModify, resourceMigration, deleteResource } from '../api';
import { getFaultyResources } from '@app/utils/resource';

// Mock data for comprehensive resource scenarios
const mockCompleteResources = {
  data: [
    {
      name: 'database-primary',
      node_name: 'db-node-1',
      uuid: 'uuid-db-primary-1',
      props: {
        'Aux/description': 'Primary database resource',
        'Aux/environment': 'production',
        'Aux/team': 'database-team',
      },
      flags: ['CLEAN', 'PRIMARY'],
      layer_object: {
        children: [],
        type: 'DRBD',
        drbd: {
          drbd_resource_definition: {
            resource_name_suffix: '',
            peer_slots: 31,
            al_stripes: 1,
            al_stripe_size_kib: 32,
            port: 7000,
            transport_type: 'IP',
            secret: 'secret123',
            down: false,
          },
          node_id: 0,
          peer_slots: 31,
          al_stripes: 1,
          al_stripe_size_kib: 32,
          flags: ['PRIMARY'],
          drbd_volumes: [
            {
              drbd_volume_definition: {
                volume_number: 0,
                minor_number: 1000,
              },
              device_path: '/dev/drbd1000',
              backing_device: '/dev/mapper/drbdpool-database--primary_00000',
              meta_device: 'internal',
              allocated_size_kib: 10485760,
              usable_size_kib: 10485760,
            },
          ],
        },
      },
      state: {
        in_use: true,
        disk_state: 'UpToDate',
        node_state: 'Online',
      },
      volumes: [
        {
          volume_number: 0,
          storage_pool_name: 'drbdpool',
          provider_kind: 'LVM_THIN',
          device_path: '/dev/drbd1000',
          allocated_size_kib: 10485760,
          usable_size_kib: 10485760,
          props: {
            'StorDriver/StorPoolName': 'drbdpool',
          },
          flags: [],
          state: {
            disk_state: 'UpToDate',
          },
          layer_data_list: [
            {
              type: 'STORAGE',
              data: {
                volume_number: 0,
                device_path: '/dev/mapper/drbdpool-database--primary_00000',
                allocated_size_kib: 10485760,
                usable_size_kib: 10485760,
              },
            },
            {
              type: 'DRBD',
              data: {
                drbd_volume_definition: {
                  volume_number: 0,
                  minor_number: 1000,
                },
                device_path: '/dev/drbd1000',
                backing_device: '/dev/mapper/drbdpool-database--primary_00000',
                allocated_size_kib: 10485760,
                usable_size_kib: 10485760,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'database-secondary',
      node_name: 'db-node-2',
      uuid: 'uuid-db-secondary-2',
      props: {
        'Aux/description': 'Secondary database resource',
        'Aux/environment': 'production',
        'Aux/team': 'database-team',
      },
      flags: ['CLEAN'],
      layer_object: {
        children: [],
        type: 'DRBD',
        drbd: {
          drbd_resource_definition: {
            resource_name_suffix: '',
            peer_slots: 31,
            al_stripes: 1,
            al_stripe_size_kib: 32,
            port: 7000,
            transport_type: 'IP',
            secret: 'secret123',
            down: false,
          },
          node_id: 1,
          peer_slots: 31,
          al_stripes: 1,
          al_stripe_size_kib: 32,
          flags: ['SECONDARY'],
          drbd_volumes: [
            {
              drbd_volume_definition: {
                volume_number: 0,
                minor_number: 1000,
              },
              device_path: '/dev/drbd1000',
              backing_device: '/dev/mapper/drbdpool-database--secondary_00000',
              meta_device: 'internal',
              allocated_size_kib: 10485760,
              usable_size_kib: 10485760,
            },
          ],
        },
      },
      state: {
        in_use: false,
        disk_state: 'UpToDate',
        node_state: 'Online',
      },
      volumes: [
        {
          volume_number: 0,
          storage_pool_name: 'drbdpool',
          provider_kind: 'LVM_THIN',
          device_path: '/dev/drbd1000',
          allocated_size_kib: 10485760,
          usable_size_kib: 10485760,
          props: {
            'StorDriver/StorPoolName': 'drbdpool',
          },
          flags: [],
          state: {
            disk_state: 'UpToDate',
          },
          layer_data_list: [
            {
              type: 'STORAGE',
              data: {
                volume_number: 0,
                device_path: '/dev/mapper/drbdpool-database--secondary_00000',
                allocated_size_kib: 10485760,
                usable_size_kib: 10485760,
              },
            },
            {
              type: 'DRBD',
              data: {
                drbd_volume_definition: {
                  volume_number: 0,
                  minor_number: 1000,
                },
                device_path: '/dev/drbd1000',
                backing_device: '/dev/mapper/drbdpool-database--secondary_00000',
                allocated_size_kib: 10485760,
                usable_size_kib: 10485760,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'web-app-diskless',
      node_name: 'web-node-1',
      uuid: 'uuid-web-diskless-3',
      props: {
        'Aux/description': 'Diskless web application resource',
        'Aux/environment': 'staging',
        'Aux/team': 'web-team',
      },
      flags: ['DISKLESS', 'CLEAN'],
      layer_object: {
        children: [],
        type: 'DRBD',
        drbd: {
          drbd_resource_definition: {
            resource_name_suffix: '',
            peer_slots: 31,
            al_stripes: 1,
            al_stripe_size_kib: 32,
            port: 7001,
            transport_type: 'IP',
            secret: 'secret456',
            down: false,
          },
          node_id: 2,
          peer_slots: 31,
          al_stripes: 1,
          al_stripe_size_kib: 32,
          flags: ['DISKLESS'],
          drbd_volumes: [
            {
              drbd_volume_definition: {
                volume_number: 0,
                minor_number: 1001,
              },
              device_path: '/dev/drbd1001',
              backing_device: null,
              meta_device: 'internal',
              allocated_size_kib: 0,
              usable_size_kib: 5242880,
            },
          ],
        },
      },
      state: {
        in_use: false,
        disk_state: 'Diskless',
        node_state: 'Online',
      },
      volumes: [
        {
          volume_number: 0,
          storage_pool_name: 'DfltDisklessStorPool',
          provider_kind: 'DISKLESS',
          device_path: '/dev/drbd1001',
          allocated_size_kib: 0,
          usable_size_kib: 5242880,
          props: {
            'StorDriver/StorPoolName': 'DfltDisklessStorPool',
          },
          flags: ['DISKLESS'],
          state: {
            disk_state: 'Diskless',
          },
          layer_data_list: [
            {
              type: 'DRBD',
              data: {
                drbd_volume_definition: {
                  volume_number: 0,
                  minor_number: 1001,
                },
                device_path: '/dev/drbd1001',
                backing_device: null,
                allocated_size_kib: 0,
                usable_size_kib: 5242880,
              },
            },
          ],
        },
      ],
    },
  ],
};

const mockFaultyResources = [
  {
    name: 'faulty-resource',
    node_name: 'faulty-node',
    uuid: 'uuid-faulty-4',
    props: {
      'Aux/description': 'Resource with issues',
    },
    flags: ['FAILED'],
    state: {
      in_use: false,
      disk_state: 'Failed',
      node_state: 'Online',
    },
    volumes: [
      {
        volume_number: 0,
        storage_pool_name: 'broken-pool',
        provider_kind: 'LVM',
        device_path: '/dev/drbd1002',
        allocated_size_kib: 0,
        usable_size_kib: 0,
        state: {
          disk_state: 'Failed',
        },
      },
    ],
  },
];

const mockSuccessResponse = {
  data: [
    {
      ret_code: 0,
      message: 'Success',
      details: null,
    },
  ],
};

describe('Resource Integration Tests', () => {
  let mockGet: any;
  let mockPost: any;
  let mockPut: any;
  let mockDel: any;
  let mockGetFaultyResources: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGet = vi.mocked(get);
    mockPost = vi.mocked(post);
    mockPut = vi.mocked(put);
    mockDel = vi.mocked(del);
    mockGetFaultyResources = vi.mocked(getFaultyResources);

    // Setup default mock implementations
    mockGet.mockResolvedValue(mockCompleteResources);
    mockPost.mockResolvedValue(mockSuccessResponse);
    mockPut.mockResolvedValue(mockSuccessResponse);
    mockDel.mockResolvedValue(mockSuccessResponse);
    mockGetFaultyResources.mockReturnValue(mockFaultyResources);
  });

  describe('Complete Resource Lifecycle Workflow', () => {
    it('should handle complete resource deployment workflow', async () => {
      // 1. Create resource on primary node
      const createResourceData = {
        node_name: 'db-node-1',
        layer_list: ['STORAGE', 'DRBD'],
        props: {
          'Aux/description': 'Primary database resource',
          'Aux/environment': 'production',
        },
      };

      await resourceCreateOnNode('database-primary', 'db-node-1', createResourceData);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'database-primary',
            node: 'db-node-1',
          },
        },
        body: createResourceData,
      });

      // 2. Create resource on secondary node
      const secondaryResourceData = {
        node_name: 'db-node-2',
        layer_list: ['STORAGE', 'DRBD'],
        props: {
          'Aux/description': 'Secondary database resource',
          'Aux/environment': 'production',
        },
      };

      await resourceCreateOnNode('database-primary', 'db-node-2', secondaryResourceData);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'database-primary',
            node: 'db-node-2',
          },
        },
        body: secondaryResourceData,
      });

      // 3. Create diskless resource on client node
      const disklessResourceData = {
        node_name: 'web-node-1',
        layer_list: ['DRBD'],
        flags: ['DISKLESS'],
        props: {
          'Aux/description': 'Diskless web application resource',
          'Aux/environment': 'staging',
        },
      };

      await resourceCreateOnNode('database-primary', 'web-node-1', disklessResourceData);

      // 4. Verify all resources are created
      expect(mockPost).toHaveBeenCalledTimes(3);
    });

    it('should handle resource modification and property management', async () => {
      // 1. Add new properties to resource
      const addPropsModification = {
        override_props: {
          'Aux/team': 'database-team',
          'Aux/backup-schedule': 'daily',
          'Aux/monitoring': 'enabled',
        },
        delete_props: [],
      };

      await resourceModify('database-primary', 'db-node-1', addPropsModification);

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'database-primary',
            node: 'db-node-1',
          },
        },
        body: addPropsModification,
      });

      // 2. Update existing properties
      const updatePropsModification = {
        override_props: {
          'Aux/description': 'Updated primary database resource',
          'Aux/environment': 'production-v2',
        },
        delete_props: ['Aux/backup-schedule'], // Remove old backup schedule
      };

      await resourceModify('database-primary', 'db-node-1', updatePropsModification);

      expect(mockPut).toHaveBeenLastCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'database-primary',
            node: 'db-node-1',
          },
        },
        body: updatePropsModification,
      });

      expect(mockPut).toHaveBeenCalledTimes(2);
    });

    it('should handle resource migration workflow', async () => {
      // 1. Migrate resource from one node to another
      const migrationData = {
        resource: 'database-primary',
        node: 'db-node-3',
        fromnode: 'db-node-1',
      };

      await resourceMigration(migrationData);

      expect(mockPut).toHaveBeenCalledWith(
        '/v1/resource-definitions/{resource}/resources/{node}/migrate-disk/{fromnode}',
        {
          params: {
            path: {
              resource: 'database-primary',
              node: 'db-node-3',
              fromnode: 'db-node-1',
            },
          },
        },
      );

      // 2. Verify the old resource is cleaned up after migration
      await deleteResource('database-primary', 'db-node-1');

      expect(mockDel).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'database-primary',
            node: 'db-node-1',
          },
        },
      });
    });

    it('should handle disaster recovery scenario', async () => {
      // 1. Get all resources to assess situation
      await getResources();

      expect(mockGet).toHaveBeenCalledWith('/v1/view/resources', {
        params: {
          query: undefined,
        },
      });

      // 2. Identify faulty resources
      const faultyResources = mockGetFaultyResources(mockCompleteResources.data);
      expect(mockGetFaultyResources).toHaveBeenCalledWith(mockCompleteResources.data);

      // 3. Delete faulty resource
      await deleteResource('faulty-resource', 'faulty-node');

      expect(mockDel).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'faulty-resource',
            node: 'faulty-node',
          },
        },
      });

      // 4. Recreate resource on healthy node
      const recoveryResourceData = {
        node_name: 'recovery-node',
        layer_list: ['STORAGE', 'DRBD'],
        props: {
          'Aux/description': 'Recovered resource',
          'Aux/recovery-date': new Date().toISOString(),
        },
      };

      await resourceCreateOnNode('recovered-resource', 'recovery-node', recoveryResourceData);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'recovered-resource',
            node: 'recovery-node',
          },
        },
        body: recoveryResourceData,
      });
    });
  });

  describe('Resource State and Health Management', () => {
    it('should handle complex resource queries with filtering', async () => {
      // 1. Query specific resources
      const specificQuery = {
        resources: ['database-primary', 'web-app-diskless'],
        nodes: ['db-node-1', 'web-node-1'],
        storage_pools: ['drbdpool', 'DfltDisklessStorPool'],
      };

      await getResources(specificQuery);

      expect(mockGet).toHaveBeenCalledWith('/v1/view/resources', {
        params: {
          query: specificQuery,
        },
      });

      // 2. Query by properties
      const propertyQuery = {
        props: ['Aux/environment=production', 'Aux/team=database-team'],
      };

      await getResources(propertyQuery);

      expect(mockGet).toHaveBeenCalledWith('/v1/view/resources', {
        params: {
          query: propertyQuery,
        },
      });

      // 3. Query with complex combinations
      const complexQuery = {
        resources: ['database-primary'],
        nodes: ['db-node-1', 'db-node-2'],
        storage_pools: ['drbdpool'],
        with_volume: true,
        cached: false,
      };

      await getResources(complexQuery);

      expect(mockGet).toHaveBeenCalledTimes(3);
    });

    it('should handle resource state transitions', async () => {
      // 1. Modify resource to change state
      const stateChangeModification = {
        override_props: {
          'DrbdOptions/auto-promote': 'yes',
          'Aux/promotion-target': 'primary',
        },
        delete_props: [],
      };

      await resourceModify('database-primary', 'db-node-1', stateChangeModification);

      // 2. Verify state change through another modification
      const verifyStateModification = {
        override_props: {
          'Aux/state-verified': 'true',
          'Aux/verification-time': new Date().toISOString(),
        },
        delete_props: [],
      };

      await resourceModify('database-primary', 'db-node-1', verifyStateModification);

      expect(mockPut).toHaveBeenCalledTimes(2);
    });

    it('should handle multi-volume resource operations', async () => {
      // Create resource with multiple volumes
      const multiVolumeResourceData = {
        node_name: 'multi-volume-node',
        layer_list: ['STORAGE', 'DRBD'],
        props: {
          'Aux/description': 'Multi-volume database resource',
          'Aux/volumes': 'data,logs,temp',
        },
      };

      await resourceCreateOnNode('multi-volume-db', 'multi-volume-node', multiVolumeResourceData);

      // Modify each volume independently
      const volumes = [0, 1, 2];
      for (const volumeNumber of volumes) {
        const volumeSpecificModification = {
          override_props: {
            [`Aux/volume-${volumeNumber}-purpose`]: volumeNumber === 0 ? 'data' : volumeNumber === 1 ? 'logs' : 'temp',
            [`Aux/volume-${volumeNumber}-modified`]: new Date().toISOString(),
          },
          delete_props: [],
        };

        await resourceModify('multi-volume-db', 'multi-volume-node', volumeSpecificModification);
      }

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledTimes(3);
    });
  });

  describe('Resource Performance and Scale Testing', () => {
    it('should handle bulk resource operations efficiently', async () => {
      const resourceNames = Array.from({ length: 10 }, (_, i) => `bulk-resource-${i}`);
      const nodeNames = ['node-1', 'node-2', 'node-3'];

      // Create multiple resources across multiple nodes
      const startTime = performance.now();

      for (const resourceName of resourceNames) {
        for (const nodeName of nodeNames) {
          const bulkResourceData = {
            node_name: nodeName,
            layer_list: ['STORAGE', 'DRBD'],
            props: {
              'Aux/description': `Bulk resource ${resourceName} on ${nodeName}`,
              'Aux/bulk-operation': 'true',
              'Aux/creation-time': new Date().toISOString(),
            },
          };

          await resourceCreateOnNode(resourceName, nodeName, bulkResourceData);
        }
      }

      const endTime = performance.now();

      // Should complete within reasonable time (10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
      expect(mockPost).toHaveBeenCalledTimes(30); // 10 resources × 3 nodes
    });

    it('should handle large resource queries efficiently', async () => {
      // Mock large dataset
      const largeResourceData = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          name: `resource-${i}`,
          node_name: `node-${i % 10}`,
          uuid: `uuid-${i}`,
          props: {
            'Aux/description': `Resource ${i}`,
            'Aux/index': i.toString(),
          },
          volumes: [
            {
              volume_number: 0,
              storage_pool_name: `pool-${i % 5}`,
              allocated_size_kib: (i + 1) * 1048576,
            },
          ],
        })),
      };

      mockGet.mockResolvedValue(largeResourceData);

      const startTime = performance.now();
      const result = await getResources();
      const endTime = performance.now();

      expect(result.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent resource operations', async () => {
      // Simulate concurrent operations
      const concurrentOperations = [
        // Create operations
        resourceCreateOnNode('concurrent-resource-1', 'node-1', {
          node_name: 'node-1',
          layer_list: ['STORAGE', 'DRBD'],
        }),
        resourceCreateOnNode('concurrent-resource-2', 'node-2', {
          node_name: 'node-2',
          layer_list: ['STORAGE', 'DRBD'],
        }),
        // Modify operations
        resourceModify('existing-resource-1', 'node-1', {
          override_props: { 'Aux/concurrent-mod': 'true' },
          delete_props: [],
        }),
        resourceModify('existing-resource-2', 'node-2', {
          override_props: { 'Aux/concurrent-mod': 'true' },
          delete_props: [],
        }),
        // Query operation
        getResources(),
      ];

      const startTime = performance.now();
      await Promise.all(concurrentOperations);
      const endTime = performance.now();

      // All operations should complete concurrently
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(mockPut).toHaveBeenCalledTimes(2);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle partial failures in batch operations', async () => {
      // Setup mixed success/failure responses
      mockPost
        .mockResolvedValueOnce(mockSuccessResponse)
        .mockRejectedValueOnce(new Error('Node unavailable'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const results = [];
      const operations = [
        { resource: 'test-resource-1', node: 'good-node' },
        { resource: 'test-resource-2', node: 'bad-node' },
        { resource: 'test-resource-3', node: 'another-good-node' },
      ];

      for (const { resource, node } of operations) {
        try {
          const result = await resourceCreateOnNode(resource, node, {
            node_name: node,
            layer_list: ['STORAGE'],
          });
          results.push({ resource, node, status: 'success', result });
        } catch (error) {
          results.push({ resource, node, status: 'error', error });
        }
      }

      expect(results).toHaveLength(3);
      expect(results.filter((r) => r.status === 'success')).toHaveLength(2);
      expect(results.filter((r) => r.status === 'error')).toHaveLength(1);
      expect(results[1].status).toBe('error');
    });

    it('should handle network timeouts gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Network timeout'));

      try {
        await getResources();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Network timeout');
      }

      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed API responses', async () => {
      const malformedResponses = [{ data: null }, { data: undefined }, {}, null, undefined];

      for (const response of malformedResponses) {
        mockGet.mockResolvedValueOnce(response);

        const result = await getResources();

        // Should handle gracefully without throwing
        expect(result).not.toThrow;
      }

      expect(mockGet).toHaveBeenCalledTimes(5);
    });

    it('should handle resource conflicts and constraints', async () => {
      // Simulate constraint violation response
      const constraintViolationResponse = {
        data: [
          {
            ret_code: 4,
            message: 'Resource already exists on node',
            details: 'CONSTRAINT_VIOLATION',
          },
        ],
      };

      mockPost.mockResolvedValue(constraintViolationResponse);

      const result = await resourceCreateOnNode('existing-resource', 'node-1', {
        node_name: 'node-1',
        layer_list: ['STORAGE'],
      });

      expect(result.data[0].ret_code).toBe(4);
      expect(result.data[0].message).toContain('already exists');
    });

    it('should handle complex migration scenarios', async () => {
      // Test migration with conflicts
      const migrationConflictResponse = {
        data: [
          {
            ret_code: 16,
            message: 'Migration failed - target node insufficient space',
            details: 'INSUFFICIENT_SPACE',
          },
        ],
      };

      mockPut.mockResolvedValue(migrationConflictResponse);

      const migrationData = {
        resource: 'large-resource',
        node: 'small-node',
        fromnode: 'large-node',
      };

      const result = await resourceMigration(migrationData);

      expect(result.data[0].ret_code).toBe(16);
      expect(result.data[0].message).toContain('insufficient space');

      // Verify retry with different target node
      mockPut.mockResolvedValue(mockSuccessResponse);

      const retryMigrationData = {
        resource: 'large-resource',
        node: 'another-large-node',
        fromnode: 'large-node',
      };

      const retryResult = await resourceMigration(retryMigrationData);

      expect(retryResult.data[0].ret_code).toBe(0);
      expect(mockPut).toHaveBeenCalledTimes(2);
    });
  });

  describe('Resource Monitoring and Observability', () => {
    it('should track resource creation and modification timestamps', async () => {
      const timestamp = new Date().toISOString();

      const trackedResourceData = {
        node_name: 'monitored-node',
        layer_list: ['STORAGE', 'DRBD'],
        props: {
          'Aux/description': 'Monitored resource for observability',
          'Aux/created-at': timestamp,
          'Aux/created-by': 'integration-test',
          'Aux/version': '1.0',
        },
      };

      await resourceCreateOnNode('monitored-resource', 'monitored-node', trackedResourceData);

      // Later modification with tracking
      const modificationTimestamp = new Date().toISOString();
      const trackedModification = {
        override_props: {
          'Aux/last-modified': modificationTimestamp,
          'Aux/modified-by': 'integration-test',
          'Aux/version': '1.1',
          'Aux/change-reason': 'Performance optimization',
        },
        delete_props: [],
      };

      await resourceModify('monitored-resource', 'monitored-node', trackedModification);

      expect(mockPost).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'monitored-resource',
            node: 'monitored-node',
          },
        },
        body: trackedResourceData,
      });

      expect(mockPut).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}', {
        params: {
          path: {
            resource: 'monitored-resource',
            node: 'monitored-node',
          },
        },
        body: trackedModification,
      });
    });

    it('should support resource health checks and monitoring', async () => {
      // Query resources with health status
      const healthQuery = {
        with_volume: true,
        cached: false,
      };

      await getResources(healthQuery);

      expect(mockGet).toHaveBeenCalledWith('/v1/view/resources', {
        params: {
          query: healthQuery,
        },
      });

      // Get faulty resources for monitoring
      const allResources = mockCompleteResources.data;
      const faultyResources = mockGetFaultyResources(allResources);

      expect(mockGetFaultyResources).toHaveBeenCalledWith(allResources);
      expect(faultyResources).toBeDefined();

      // Track monitoring metadata
      if (faultyResources.length > 0) {
        const monitoringUpdate = {
          override_props: {
            'Aux/health-status': 'degraded',
            'Aux/last-health-check': new Date().toISOString(),
            'Aux/alert-sent': 'true',
          },
          delete_props: [],
        };

        await resourceModify('faulty-resource', 'faulty-node', monitoringUpdate);
      }
    });
  });
});
