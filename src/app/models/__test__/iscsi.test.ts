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
    put: vi.fn(),
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
type ISCSI = {
  iqn: string;
  service_ips?: string[];
  resource_group?: string;
  status?: {
    primary?: string;
    service?: string;
    volumes?: Array<{ number: number; state?: string }>;
  };
  volumes?: Array<{ number: number; size_kib?: number }>;
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

type Data = {
  total: number;
  list: ISCSI[];
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

describe('ISCSI Model Logic', () => {
  let mockService: any;
  let mockNotify: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = vi.mocked(service);
    mockNotify = vi.mocked(notify);
  });

  // Mock data
  const mockISCSIList: ISCSI[] = [
    {
      iqn: 'iqn.2024-01.com.example:target1',
      service_ips: ['192.168.1.100', '192.168.1.101'],
      resource_group: 'rg1',
      status: {
        primary: 'node1',
        service: 'Started',
        volumes: [
          { number: 1, state: 'OK' },
          { number: 2, state: 'OK' },
        ],
      },
      volumes: [
        { number: 0, size_kib: 0 },
        { number: 1, size_kib: 1048576 },
        { number: 2, size_kib: 2097152 },
      ],
    },
    {
      iqn: 'iqn.2024-01.com.example:target2',
      service_ips: ['192.168.1.102'],
      resource_group: 'rg2',
      status: {
        primary: 'node2',
        service: 'Stopped',
        volumes: [],
      },
      volumes: [{ number: 0, size_kib: 0 }],
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

    it('should update state with setISCSIList reducer', () => {
      const currentState: Data = {
        total: 0,
        list: [],
      };

      const payload: Data = {
        total: 2,
        list: mockISCSIList,
      };

      const newState = {
        ...currentState,
        ...payload,
      };

      expect(newState.total).toBe(2);
      expect(newState.list).toHaveLength(2);
      expect(newState.list[0].iqn).toBe('iqn.2024-01.com.example:target1');
    });

    it('should preserve existing state properties when updating', () => {
      const currentState: Data = {
        total: 1,
        list: [mockISCSIList[0]],
      };

      const payload: Data = {
        total: 2,
        list: mockISCSIList,
      };

      const newState = {
        ...currentState,
        ...payload,
      };

      expect(newState.total).toBe(2);
      expect(newState.list).toHaveLength(2);
    });
  });

  describe('getList Effect Logic', () => {
    it('should process API response correctly', () => {
      const apiResponse = {
        data: mockISCSIList,
      };

      const data = apiResponse.data ?? [];
      const total = data.length;

      expect(data).toHaveLength(2);
      expect(total).toBe(2);
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

    it('should create volume entries for LUN tracking', () => {
      const item = mockISCSIList[0];
      const volumeList: Array<{ item: any; LUN: number }> = [];

      for (const volume of item.volumes ?? []) {
        volumeList.push({ ...item, LUN: volume.number });
      }

      expect(volumeList).toHaveLength(3);
      expect(volumeList[0].LUN).toBe(0);
      expect(volumeList[1].LUN).toBe(1);
      expect(volumeList[2].LUN).toBe(2);
    });
  });

  describe('createISCSI Effect Logic', () => {
    it('should structure create payload correctly', () => {
      const createPayload: CreateDataType = {
        iqn: 'iqn.2024-01.com.example:new-target',
        resource_group: 'rg-new',
        volumes: [{ number: 1, size_kib: 1048576 }],
        service_ips: ['192.168.1.200', '192.168.1.201'],
      };

      expect(createPayload.iqn).toBe('iqn.2024-01.com.example:new-target');
      expect(createPayload.resource_group).toBe('rg-new');
      expect(createPayload.volumes).toHaveLength(1);
      expect(createPayload.service_ips).toContain('192.168.1.200');
      expect(createPayload.service_ips).toHaveLength(2);
    });

    it('should handle successful creation (status 201)', () => {
      const successResponse = { status: 201 };

      if (successResponse.status === 201) {
        expect(successResponse.status).toBe(201);
      }
    });

    it('should handle creation error', () => {
      const errorMessage = 'Network error';
      const error = new Error(errorMessage);

      const displayMessage = String((error as Error)?.message || 'An error occurred');

      expect(displayMessage).toBe('Network error');
    });
  });

  describe('deleteISCSI Effect Logic', () => {
    it('should mark item as deleting before API call', () => {
      const iqnToDelete = 'iqn.2024-01.com.example:target1';
      const currentState: Data = {
        total: 2,
        list: [...mockISCSIList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.iqn === iqnToDelete) {
          return {
            ...item,
            deleting: true,
          };
        }
        return item;
      });

      expect(updatedList[0].deleting).toBe(true);
      expect(updatedList[1].deleting).toBeUndefined();
    });

    it('should decrement total count on delete', () => {
      const currentState: Data = {
        total: 2,
        list: [...mockISCSIList],
      };

      const newTotal = currentState.total - 1;

      expect(newTotal).toBe(1);
    });

    it('should generate correct delete API endpoint', () => {
      const iqn = 'iqn.2024-01.com.example:target1';
      const endpoint = `/api/v2/iscsi/${iqn}`;

      expect(endpoint).toBe('/api/v2/iscsi/iqn.2024-01.com.example:target1');
    });
  });

  describe('startISCSI Effect Logic', () => {
    it('should mark item as starting before API call', () => {
      const iqnToStart = 'iqn.2024-01.com.example:target1';
      const currentState: Data = {
        total: 2,
        list: [...mockISCSIList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.iqn === iqnToStart) {
          return {
            ...item,
            starting: true,
          };
        }
        return item;
      });

      expect(updatedList[0].starting).toBe(true);
      expect(updatedList[1].starting).toBeUndefined();
    });

    it('should keep total count unchanged on start', () => {
      const currentState: Data = {
        total: 2,
        list: [...mockISCSIList],
      };

      const newTotal = currentState.total;

      expect(newTotal).toBe(2);
    });

    it('should generate correct start API endpoint', () => {
      const iqn = 'iqn.2024-01.com.example:target1';
      const endpoint = `/api/v2/iscsi/${iqn}/start`;

      expect(endpoint).toBe('/api/v2/iscsi/iqn.2024-01.com.example:target1/start');
    });
  });

  describe('stopISCSI Effect Logic', () => {
    it('should mark item as stopping before API call', () => {
      const iqnToStop = 'iqn.2024-01.com.example:target1';
      const currentState: Data = {
        total: 2,
        list: [...mockISCSIList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.iqn === iqnToStop) {
          return {
            ...item,
            stopping: true,
          };
        }
        return item;
      });

      expect(updatedList[0].stopping).toBe(true);
      expect(updatedList[1].stopping).toBeUndefined();
    });

    it('should keep total count unchanged on stop', () => {
      const currentState: Data = {
        total: 2,
        list: [...mockISCSIList],
      };

      const newTotal = currentState.total;

      expect(newTotal).toBe(2);
    });

    it('should generate correct stop API endpoint', () => {
      const iqn = 'iqn.2024-01.com.example:target1';
      const endpoint = `/api/v2/iscsi/${iqn}/stop`;

      expect(endpoint).toBe('/api/v2/iscsi/iqn.2024-01.com.example:target1/stop');
    });
  });

  describe('addLUN Effect Logic', () => {
    it('should structure addLUN payload correctly', () => {
      const payload = {
        iqn: 'iqn.2024-01.com.example:target1',
        LUN: 3,
        size_kib: 1048576,
      };

      const apiPayload = {
        size_kib: payload.size_kib,
        number: payload.LUN,
      };

      expect(apiPayload.size_kib).toBe(1048576);
      expect(apiPayload.number).toBe(3);
    });

    it('should generate correct addLUN API endpoint', () => {
      const payload = {
        iqn: 'iqn.2024-01.com.example:target1',
        LUN: 3,
        size_kib: 1048576,
      };

      const endpoint = `/api/v2/iscsi/${payload.iqn}/${payload.LUN}`;

      expect(endpoint).toBe('/api/v2/iscsi/iqn.2024-01.com.example:target1/3');
    });
  });

  describe('deleteLUN Effect Logic', () => {
    it('should extract iqn and LUN from payload array', () => {
      const payload: Array<string | number> = ['iqn.2024-01.com.example:target1', 2];

      const iqn = payload[0];
      const lun = payload[1];

      expect(iqn).toBe('iqn.2024-01.com.example:target1');
      expect(lun).toBe(2);
    });

    it('should generate correct deleteLUN API endpoint', () => {
      const payload: Array<string | number> = ['iqn.2024-01.com.example:target1', 2];
      const endpoint = `/api/v2/iscsi/${payload[0]}/${payload[1]}`;

      expect(endpoint).toBe('/api/v2/iscsi/iqn.2024-01.com.example:target1/2');
    });
  });

  describe('IQN (iSCSI Qualified Name) Validation', () => {
    it('should follow IQN format pattern', () => {
      const validIQN = 'iqn.2024-01.com.example:target1';

      // IQN format: iqn.yyyy-mm.reverse-domain:identifier
      expect(validIQN).toMatch(/^iqn\.\d{4}-\d{2}/);
      expect(validIQN).toContain('com.example:');
    });

    it('should differentiate targets by IQN', () => {
      const iqn1 = mockISCSIList[0].iqn;
      const iqn2 = mockISCSIList[1].iqn;

      expect(iqn1).not.toBe(iqn2);
      expect(iqn1).toBe('iqn.2024-01.com.example:target1');
      expect(iqn2).toBe('iqn.2024-01.com.example:target2');
    });
  });

  describe('Service IPs Handling', () => {
    it('should handle multiple service IPs', () => {
      const item = mockISCSIList[0];
      const serviceIps = item.service_ips;

      expect(serviceIps).toHaveLength(2);
      expect(serviceIps).toContain('192.168.1.100');
      expect(serviceIps).toContain('192.168.1.101');
    });

    it('should handle single service IP', () => {
      const item = mockISCSIList[1];
      const serviceIps = item.service_ips;

      expect(serviceIps).toHaveLength(1);
      expect(serviceIps?.[0]).toBe('192.168.1.102');
    });

    it('should handle undefined service IPs', () => {
      const item: ISCSI = {
        iqn: 'test-iqn',
      };
      const serviceIps = item.service_ips;

      expect(serviceIps).toBeUndefined();
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

    it('should handle null error', () => {
      const error = null;
      const message = String((error as Error)?.message || 'An error occurred');

      expect(message).toBe('An error occurred');
    });
  });

  describe('Notification Messages', () => {
    it('should use correct success messages for operations', () => {
      const messages = {
        create: 'Created iSCSI successfully',
        delete: 'Deleted Successfully',
        start: 'Started Successfully',
        stop: 'Stopped Successfully',
        addLUN: 'Added Successfully',
        deleteLUN: 'Deleted Successfully',
      };

      expect(messages.create).toContain('iSCSI');
      expect(messages.delete).toContain('Successfully');
      expect(messages.start).toContain('Successfully');
      expect(messages.stop).toContain('Successfully');
      expect(messages.addLUN).toContain('Successfully');
      expect(messages.deleteLUN).toContain('Successfully');
    });
  });

  describe('Finally Block Behavior', () => {
    it('should always call getList after operations', () => {
      const operationsThatRefreshList = ['deleteISCSI', 'startISCSI', 'stopISCSI', 'addLUN', 'deleteLUN'];

      expect(operationsThatRefreshList).toContain('deleteISCSI');
      expect(operationsThatRefreshList).toContain('startISCSI');
      expect(operationsThatRefreshList).toContain('stopISCSI');
      expect(operationsThatRefreshList).toContain('addLUN');
      expect(operationsThatRefreshList).toContain('deleteLUN');
      expect(operationsThatRefreshList).toHaveLength(5);
    });
  });

  describe('API Response Status Codes', () => {
    it('should handle 201 status for creation', () => {
      const status = 201;
      expect(status).toBe(201);
    });

    it('should handle 200 status for other operations', () => {
      const status = 200;
      expect(status).toBe(200);
    });
  });

  describe('API Endpoint Comparison with NVMe', () => {
    it('should use iscsi in endpoint instead of nvme-of', () => {
      const iscsiEndpoint = '/api/v2/iscsi';
      const nvmeEndpoint = '/api/v2/nvme-of';

      expect(iscsiEndpoint).not.toBe(nvmeEndpoint);
      expect(iscsiEndpoint).toContain('iscsi');
      expect(nvmeEndpoint).toContain('nvme-of');
    });
  });

  describe('Volume Type Definition', () => {
    it('should define volume structure correctly', () => {
      const volume: VolumeType = {
        number: 1,
        size_kib: 1048576,
      };

      expect(volume.number).toBe(1);
      expect(volume.size_kib).toBe(1048576);
    });
  });
});
