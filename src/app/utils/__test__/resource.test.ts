// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { isFaultyResource, getResourceState, getVolumeState, getFaultyResources } from '../resource';

// Mock data interfaces
interface Connection {
  connected: boolean;
  message?: string;
}

interface Volume {
  volume_number?: number;
  flags?: string[];
  state?: {
    disk_state?: string;
  };
  data_v1?: {
    layer_data_list?: Array<{
      type: string;
    }>;
    state?: {
      disk_state?: string;
    };
  };
  layer_data_list?: Array<{
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  }>;
  reports?: Array<{
    is_error: () => boolean;
  }>;
}

interface Resource {
  name: string;
  node_name: string;
  flags: string[];
  volumes?: Volume[];
  layer_data?: {
    drbd_resource?: {
      connections?: Record<string, Connection>;
    };
  };
  layer_object?: {
    type: string;
    drbd?: {
      connections?: Record<string, Connection>;
    };
  };
}

describe('resource utils', () => {
  describe('getVolumeState', () => {
    it('should return Created state for non-DRBD volumes', () => {
      const volume: Volume = {
        layer_data_list: [{ type: 'STORAGE' }],
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('Created');
      expect(isBad).toBe(false);
    });

    it('should return Resizing prefix for volumes with RESIZE flag', () => {
      const volume: Volume = {
        flags: ['RESIZE'],
        layer_data_list: [{ type: 'STORAGE' }],
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('Resizing, Created');
      expect(isBad).toBe(false);
    });

    it('should return Unknown state for DRBD volumes without disk state', () => {
      const volume: Volume = {
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
        },
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('Unknown');
      expect(isBad).toBe(true);
    });

    it('should return Unknown state for DUnknown disk state', () => {
      const volume: Volume = {
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
          state: { disk_state: 'DUnknown' },
        },
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('Unknown');
      expect(isBad).toBe(true);
    });

    it('should handle Diskless state with DISKLESS resource flag', () => {
      const volume: Volume = {
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
          state: { disk_state: 'Diskless' },
        },
      };
      const [state, isBad] = getVolumeState(volume, ['DISKLESS']);
      expect(state).toBe('Diskless');
      expect(isBad).toBe(false);
    });

    it('should handle Diskless state without DISKLESS resource flag as faulty', () => {
      const volume: Volume = {
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
          state: { disk_state: 'Diskless' },
        },
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('Diskless');
      expect(isBad).toBe(true);
    });

    it('should handle TieBreaker state', () => {
      const volume: Volume = {
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
          state: { disk_state: 'Diskless' },
        },
      };
      const [state, isBad] = getVolumeState(volume, ['DISKLESS', 'TIE_BREAKER']);
      expect(state).toBe('TieBreaker');
      expect(isBad).toBe(false);
    });

    it('should identify problematic disk states as faulty', () => {
      const problematicStates = ['Inconsistent', 'Failed', 'To: Creating', 'To: Attachable', 'To: Attaching'];

      problematicStates.forEach((diskState) => {
        const volume: Volume = {
          data_v1: {
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: diskState },
          },
        };
        const [state, isBad] = getVolumeState(volume, []);
        expect(state).toBe(diskState);
        expect(isBad).toBe(true);
      });
    });

    it('should identify healthy disk states as non-faulty', () => {
      const healthyStates = ['UpToDate', 'Created', 'Attached'];

      healthyStates.forEach((diskState) => {
        const volume: Volume = {
          data_v1: {
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: diskState },
          },
        };
        const [state, isBad] = getVolumeState(volume, []);
        expect(state).toBe(diskState);
        expect(isBad).toBe(false);
      });
    });

    it('should use state from volume.state when data_v1.state is not available', () => {
      const volume: Volume = {
        layer_data_list: [{ type: 'DRBD' }],
        state: { disk_state: 'UpToDate' },
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('UpToDate');
      expect(isBad).toBe(false);
    });

    it('should default unknown disk states as faulty', () => {
      const volume: Volume = {
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
          state: { disk_state: 'SomeUnknownState' },
        },
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('SomeUnknownState');
      expect(isBad).toBe(true);
    });

    it('should handle resizing with disk state', () => {
      const volume: Volume = {
        flags: ['RESIZE'],
        data_v1: {
          layer_data_list: [{ type: 'DRBD' }],
          state: { disk_state: 'UpToDate' },
        },
      };
      const [state, isBad] = getVolumeState(volume, []);
      expect(state).toBe('Resizing, UpToDate');
      expect(isBad).toBe(false);
    });
  });

  describe('getResourceState', () => {
    it('should return DELETING for resource with DELETE flag', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['DELETE'],
      };
      const state = getResourceState(resource);
      expect(state).toBe('DELETING');
    });

    it('should return DELETING for resource with DRBD_DELETE flag', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['DRBD_DELETE'],
      };
      const state = getResourceState(resource);
      expect(state).toBe('DELETING');
    });

    it('should return RSC_INACTIVE for inactive resource', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['RSC_INACTIVE'],
      };
      const state = getResourceState(resource);
      expect(state).toBe('RSC_INACTIVE');
    });

    it('should return volume state when volumes exist', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
          },
        ],
      };
      const state = getResourceState(resource);
      expect(state).toBe('UpToDate');
    });

    it('should return Unknown when no valid state is found', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [],
      };
      const state = getResourceState(resource);
      expect(state).toBe('Unknown');
    });

    it('should return the state of the first non-Unknown volume if no targetVolumeNumber is provided (legacy behavior)', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            volume_number: 0,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'UpToDate' },
          },
          {
            volume_number: 1,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'Inconsistent' },
          },
        ],
      };
      const state = getResourceState(resource);
      // New behavior: prioritize bad states
      expect(state).toBe('Inconsistent');
    });

    it('should return the specific volume state when targetVolumeNumber is provided', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            volume_number: 0,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'UpToDate' },
          },
          {
            volume_number: 1,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'Inconsistent' },
          },
        ],
      };
      const state0 = getResourceState(resource, 0);
      expect(state0).toBe('UpToDate');
      const state1 = getResourceState(resource, 1);
      expect(state1).toBe('Inconsistent');
    });

    it('should include Evacuating when EVACUATE flag is present', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['EVACUATE'],
        volumes: [
          {
            volume_number: 0,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'UpToDate' },
          },
        ],
      };
      const state = getResourceState(resource);
      expect(state).toBe('UpToDate, Evacuating');
    });

    it('should return comma-separated unique states for multiple volumes without targetVolumeNumber', () => {
      // If all good, show all good.
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            volume_number: 0,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'UpToDate' },
          },
          {
            volume_number: 1,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'Created' },
          },
        ],
      };
      const state = getResourceState(resource);
      expect(state).toBe('UpToDate, Created');
    });

    it('should prioritize bad states in summary (ignore healthy ones if bad ones exist)', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            volume_number: 0,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'UpToDate' }, // Good
          },
          {
            volume_number: 1,
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'Inconsistent' }, // Bad
          },
        ],
      };
      const state = getResourceState(resource);
      expect(state).toBe('Inconsistent');
    });

    it('should handle volumes with Resizing flag in combination with EVACUATE', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['EVACUATE'],
        volumes: [
          {
            volume_number: 0,
            flags: ['RESIZE'],
            layer_data_list: [{ type: 'DRBD' }],
            state: { disk_state: 'UpToDate' },
          },
        ],
      };
      const state = getResourceState(resource, 0);
      expect(state).toBe('Resizing, UpToDate, Evacuating');
    });
  });

  describe('isFaultyResource', () => {
    it('should return true for resource with DELETE flag', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['DELETE'],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for resource with DRBD_DELETE flag', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['DRBD_DELETE'],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for inactive resource', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['RSC_INACTIVE'],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for resource with bad volume state', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'Failed' },
            },
          },
        ],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for volume with error reports', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
            reports: [
              {
                is_error: () => true,
              },
            ],
          },
        ],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for resource with SKIP_DISK flag', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: ['SKIP_DISK'],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
          },
        ],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for resource with volume SKIP_DISK flag', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            flags: ['SKIP_DISK'],
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
          },
        ],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for disconnected DRBD connections in layer_data', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        layer_data: {
          drbd_resource: {
            connections: {
              peer1: { connected: false },
            },
          },
        },
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for disconnected DRBD connections in layer_object', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        layer_object: {
          type: 'DRBD',
          drbd: {
            connections: {
              peer1: { connected: false },
            },
          },
        },
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return true for Unknown resource state', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [],
      };
      expect(isFaultyResource(resource)).toBe(true);
    });

    it('should return false for healthy resource', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
            reports: [
              {
                is_error: () => false,
              },
            ],
          },
        ],
        layer_data: {
          drbd_resource: {
            connections: {
              peer1: { connected: true },
            },
          },
        },
      };
      expect(isFaultyResource(resource)).toBe(false);
    });

    it('should return false for healthy resource with connected layer_object connections', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
          },
        ],
        layer_object: {
          type: 'DRBD',
          drbd: {
            connections: {
              peer1: { connected: true },
              peer2: { connected: true },
            },
          },
        },
      };
      expect(isFaultyResource(resource)).toBe(false);
    });

    it('should handle resource without volumes', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
      };
      expect(isFaultyResource(resource)).toBe(true); // Unknown state
    });

    it('should handle resource without connections', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            layer_data_list: [{ type: 'STORAGE' }],
          },
        ],
      };
      expect(isFaultyResource(resource)).toBe(false);
    });

    it('should handle empty volumes array', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [],
      };
      expect(isFaultyResource(resource)).toBe(true); // Unknown state
    });

    it('should handle volume without reports', () => {
      const resource: Resource = {
        name: 'test-resource',
        node_name: 'test-node',
        flags: [],
        volumes: [
          {
            data_v1: {
              layer_data_list: [{ type: 'DRBD' }],
              state: { disk_state: 'UpToDate' },
            },
          },
        ],
      };
      expect(isFaultyResource(resource)).toBe(false);
    });
  });

  describe('getFaultyResources', () => {
    it('should filter out only faulty resources', () => {
      const resources: Resource[] = [
        {
          name: 'healthy-resource',
          node_name: 'test-node',
          flags: [],
          volumes: [
            {
              data_v1: {
                layer_data_list: [{ type: 'DRBD' }],
                state: { disk_state: 'UpToDate' },
              },
            },
          ],
        },
        {
          name: 'faulty-resource',
          node_name: 'test-node',
          flags: ['DELETE'],
        },
        {
          name: 'another-healthy-resource',
          node_name: 'test-node',
          flags: [],
          volumes: [
            {
              layer_data_list: [{ type: 'STORAGE' }],
            },
          ],
        },
        {
          name: 'inactive-resource',
          node_name: 'test-node',
          flags: ['RSC_INACTIVE'],
        },
      ];

      const faultyResources = getFaultyResources(resources);
      expect(faultyResources).toHaveLength(2);
      expect(faultyResources[0].name).toBe('faulty-resource');
      expect(faultyResources[1].name).toBe('inactive-resource');
    });

    it('should return empty array when no faulty resources exist', () => {
      const resources: Resource[] = [
        {
          name: 'healthy-resource-1',
          node_name: 'test-node',
          flags: [],
          volumes: [
            {
              layer_data_list: [{ type: 'STORAGE' }],
            },
          ],
        },
        {
          name: 'healthy-resource-2',
          node_name: 'test-node',
          flags: [],
          volumes: [
            {
              data_v1: {
                layer_data_list: [{ type: 'DRBD' }],
                state: { disk_state: 'UpToDate' },
              },
            },
          ],
        },
      ];

      const faultyResources = getFaultyResources(resources);
      expect(faultyResources).toHaveLength(0);
    });

    it('should handle empty resources array', () => {
      const resources: Resource[] = [];
      const faultyResources = getFaultyResources(resources);
      expect(faultyResources).toHaveLength(0);
    });

    it('should return all resources when all are faulty', () => {
      const resources: Resource[] = [
        {
          name: 'faulty-resource-1',
          node_name: 'test-node',
          flags: ['DELETE'],
        },
        {
          name: 'faulty-resource-2',
          node_name: 'test-node',
          flags: ['RSC_INACTIVE'],
        },
        {
          name: 'faulty-resource-3',
          node_name: 'test-node',
          flags: [],
          volumes: [
            {
              data_v1: {
                layer_data_list: [{ type: 'DRBD' }],
                state: { disk_state: 'Failed' },
              },
            },
          ],
        },
      ];

      const faultyResources = getFaultyResources(resources);
      expect(faultyResources).toHaveLength(3);
      expect(faultyResources.map((r) => r.name)).toEqual([
        'faulty-resource-1',
        'faulty-resource-2',
        'faulty-resource-3',
      ]);
    });
  });
});
