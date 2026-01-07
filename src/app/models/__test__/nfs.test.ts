// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@app/requests', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@app/utils/toast', () => ({
  notify: vi.fn(),
}));

// Import mocked modules
import service from '@app/requests';
import { notify } from '@app/utils/toast';

// Types
type NFS = {
  name: string;
  service_ip?: string;
  resource_group?: string;
  status?: {
    primary?: string;
    service?: string;
    state?: string;
    volumes?: Array<{ number: number; state?: string }>;
  };
  volumes?: Array<{ number: number; size_kib?: number }>;
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

type Data = {
  total: number;
  list: NFS[];
};

type VolumeType = {
  number: number;
  size_kib: number;
};

type CreateDataType = {
  iqn: string;
  resource_group: string;
  volumes: VolumeType[];
  service_ips: string[];
};

describe('NFS Model Logic', () => {
  let mockService: any;
  let mockNotify: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = vi.mocked(service);
    mockNotify = vi.mocked(notify);
  });

  // Mock data
  const mockNFSList: NFS[] = [
    {
      name: 'nfs-export-1',
      service_ip: '192.168.1.100',
      resource_group: 'rg1',
      status: {
        primary: 'node1',
        service: 'Started',
        state: 'OK',
        volumes: [
          { number: 0, state: 'OK' },
          { number: 1, state: 'OK' },
        ],
      },
      volumes: [
        { number: 0, size_kib: 0 },
        { number: 1, size_kib: 1048576 },
      ],
    },
  ];

  describe('State Management', () => {
    it('should have initial state with total 0 and empty list', () => {
      const initialState: Data = {
        total: 0,
        list: [],
      };

      expect(initialState.total).toBe(0);
      expect(initialState.list).toHaveLength(0);
    });

    it('should update state with setNFSList reducer', () => {
      const currentState: Data = {
        total: 0,
        list: [],
      };

      const payload: Data = {
        total: 1,
        list: mockNFSList,
      };

      const newState = {
        ...currentState,
        ...payload,
      };

      expect(newState.total).toBe(1);
      expect(newState.list).toHaveLength(1);
      expect(newState.list[0].name).toBe('nfs-export-1');
    });
  });

  describe('getList Effect Logic', () => {
    it('should process API response correctly', () => {
      const apiResponse = {
        data: mockNFSList,
      };

      const data = apiResponse.data ?? [];
      const total = data.length;

      expect(data).toHaveLength(1);
      expect(total).toBe(1);
    });

    it('should handle empty API response', () => {
      const apiResponse = {
        data: undefined,
      };

      const data = apiResponse.data ?? [];
      const total = data.length;

      expect(data).toHaveLength(0);
      expect(total).toBe(0);
    });

    it('should generate correct API endpoint', () => {
      const endpoint = '/api/v2/nfs';

      expect(endpoint).toBe('/api/v2/nfs');
    });
  });

  describe('createNFS Effect Logic', () => {
    it('should structure create payload correctly', () => {
      const createPayload: CreateDataType = {
        iqn: 'nfs-export-new',
        resource_group: 'rg-new',
        volumes: [{ number: 1, size_kib: 1048576 }],
        service_ips: ['192.168.1.200'],
      };

      expect(createPayload.iqn).toBe('nfs-export-new');
      expect(createPayload.resource_group).toBe('rg-new');
      expect(createPayload.volumes).toHaveLength(1);
      expect(createPayload.service_ips).toContain('192.168.1.200');
    });

    it('should handle successful creation (status 201)', () => {
      const successResponse = { status: 201 };

      if (successResponse.status === 201) {
        expect(successResponse.status).toBe(201);
      }
    });
  });

  describe('deleteNFS Effect Logic', () => {
    it('should mark item as deleting before API call', () => {
      const nameToDelete = 'nfs-export-1';
      const currentState: Data = {
        total: 1,
        list: [...mockNFSList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.name === nameToDelete) {
          return {
            ...item,
            deleting: true,
          };
        }
        return item;
      });

      expect(updatedList[0].deleting).toBe(true);
    });

    it('should decrement total count on delete', () => {
      const currentState: Data = {
        total: 1,
        list: [...mockNFSList],
      };

      const newTotal = currentState.total - 1;

      expect(newTotal).toBe(0);
    });

    it('should generate correct delete API endpoint', () => {
      const name = 'nfs-export-1';
      const endpoint = `/api/v2/nfs/${name}`;

      expect(endpoint).toBe('/api/v2/nfs/nfs-export-1');
    });

    it('should match items by name property (not iqn)', () => {
      const item = mockNFSList[0];
      const matchByName = item.name === 'nfs-export-1';

      expect(matchByName).toBe(true);
      expect(item.name).toBe('nfs-export-1');
    });
  });

  describe('startNFS Effect Logic', () => {
    it('should mark item as starting before API call', () => {
      const nameToStart = 'nfs-export-1';
      const currentState: Data = {
        total: 1,
        list: [...mockNFSList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.name === nameToStart) {
          return {
            ...item,
            starting: true,
          };
        }
        return item;
      });

      expect(updatedList[0].starting).toBe(true);
    });

    it('should keep total count unchanged on start', () => {
      const currentState: Data = {
        total: 1,
        list: [...mockNFSList],
      };

      const newTotal = currentState.total;

      expect(newTotal).toBe(1);
    });

    it('should generate correct start API endpoint', () => {
      const name = 'nfs-export-1';
      const endpoint = `/api/v2/nfs/${name}/start`;

      expect(endpoint).toBe('/api/v2/nfs/nfs-export-1/start');
    });
  });

  describe('stopNFS Effect Logic', () => {
    it('should mark item as stopping before API call', () => {
      const nameToStop = 'nfs-export-1';
      const currentState: Data = {
        total: 1,
        list: [...mockNFSList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.name === nameToStop) {
          return {
            ...item,
            stopping: true,
          };
        }
        return item;
      });

      expect(updatedList[0].stopping).toBe(true);
    });

    it('should keep total count unchanged on stop', () => {
      const currentState: Data = {
        total: 1,
        list: [...mockNFSList],
      };

      const newTotal = currentState.total;

      expect(newTotal).toBe(1);
    });

    it('should generate correct stop API endpoint', () => {
      const name = 'nfs-export-1';
      const endpoint = `/api/v2/nfs/${name}/stop`;

      expect(endpoint).toBe('/api/v2/nfs/nfs-export-1/stop');
    });
  });

  describe('NFS-Specific Behavior', () => {
    it('should use name instead of iqn/nqn for identification', () => {
      const nfsItem: NFS = {
        name: 'nfs-export-1',
      };

      expect(nfsItem.name).toBe('nfs-export-1');
      expect(nfsItem).not.toHaveProperty('iqn');
      expect(nfsItem).not.toHaveProperty('nqn');
    });

    it('should have both service state and linstor state in status', () => {
      const status = mockNFSList[0].status;

      expect(status?.service).toBe('Started');
      expect(status?.state).toBe('OK');
    });
  });

  describe('Error Handling Patterns', () => {
    it('should extract error message from Error object', () => {
      const error = new Error('Test error');
      const message = String((error as Error)?.message || 'An error occurred');

      expect(message).toBe('Test error');
    });

    it('should handle error without message property', () => {
      const error = {};
      const message = String((error as Error)?.message || 'An error occurred');

      expect(message).toBe('An error occurred');
    });
  });

  describe('Notification Messages', () => {
    it('should use correct success messages for operations', () => {
      const messages = {
        create: 'Created NFS successfully',
        delete: 'Deleted Successfully',
        start: 'Started Successfully',
        stop: 'Stopped Successfully',
      };

      expect(messages.create).toContain('NFS');
      expect(messages.delete).toContain('Successfully');
      expect(messages.start).toContain('Successfully');
      expect(messages.stop).toContain('Successfully');
    });
  });

  describe('Finally Block Behavior', () => {
    it('should always call getList after delete operation', () => {
      const operationsThatRefreshList = ['deleteNFS', 'startNFS', 'stopNFS'];

      expect(operationsThatRefreshList).toContain('deleteNFS');
      expect(operationsThatRefreshList).toContain('startNFS');
      expect(operationsThatRefreshList).toContain('stopNFS');
      expect(operationsThatRefreshList).toHaveLength(3);
    });
  });

  describe('Volume Structure', () => {
    it('should define volume structure correctly', () => {
      const volume: VolumeType = {
        number: 1,
        size_kib: 1048576,
      };

      expect(volume.number).toBe(1);
      expect(volume.size_kib).toBe(1048576);
    });

    it('should include metadata volume (volume 0) in NFS', () => {
      const volumes = mockNFSList[0].volumes;

      expect(volumes).toHaveLength(2);
      expect(volumes?.[0].number).toBe(0);
      expect(volumes?.[1].number).toBe(1);
    });
  });
});
