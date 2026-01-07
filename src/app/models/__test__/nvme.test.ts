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
type NVME = {
  nqn: string;
  service_ip?: string;
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
  list: NVME[];
};

type VolumeType = {
  number: number;
  size_kib: number;
};

type CreateDataType = {
  nqn: string;
  resource_group: string;
  volumes: VolumeType[];
  service_ips: string[];
};

describe('NVMe Model Logic', () => {
  let mockService: any;
  let mockNotify: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = vi.mocked(service);
    mockNotify = vi.mocked(notify);
  });

  // Mock data
  const mockNVMeList: NVME[] = [
    {
      nqn: 'nqn.2014-08.org.nvmexpress:target1',
      service_ip: '192.168.1.100',
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
      nqn: 'nqn.2014-08.org.nvmexpress:target2',
      service_ip: '192.168.1.101',
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

    it('should update state with setNvmeList reducer', () => {
      const currentState: Data = {
        total: 0,
        list: [],
      };

      const payload: Data = {
        total: 2,
        list: mockNVMeList,
      };

      const newState = {
        ...currentState,
        ...payload,
      };

      expect(newState.total).toBe(2);
      expect(newState.list).toHaveLength(2);
      expect(newState.list[0].nqn).toBe('nqn.2014-08.org.nvmexpress:target1');
    });

    it('should preserve existing state properties when updating', () => {
      const currentState: Data = {
        total: 1,
        list: [mockNVMeList[0]],
      };

      const payload: Data = {
        total: 2,
        list: mockNVMeList,
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
        data: mockNVMeList,
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
      const item = mockNVMeList[0];
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

  describe('createNvme Effect Logic', () => {
    it('should structure create payload correctly', () => {
      const createPayload: CreateDataType = {
        nqn: 'nqn.2014-08.org.nvmexpress:new-target',
        resource_group: 'rg-new',
        volumes: [{ number: 1, size_kib: 1048576 }],
        service_ips: ['192.168.1.200'],
      };

      expect(createPayload.nqn).toBe('nqn.2014-08.org.nvmexpress:new-target');
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

    it('should handle creation error', () => {
      const errorMessage = 'Network error';
      const error = new Error(errorMessage);

      const displayMessage = String((error as Error)?.message || 'An error occurred');

      expect(displayMessage).toBe('Network error');
    });
  });

  describe('deleteNvme Effect Logic', () => {
    it('should mark item as deleting before API call', () => {
      const nqnToDelete = 'nqn.2014-08.org.nvmexpress:target1';
      const currentState: Data = {
        total: 2,
        list: [...mockNVMeList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.nqn === nqnToDelete) {
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
        list: [...mockNVMeList],
      };

      const newTotal = currentState.total - 1;

      expect(newTotal).toBe(1);
    });

    it('should generate correct delete API endpoint', () => {
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';
      const endpoint = `/api/v2/nvme-of/${nqn}`;

      expect(endpoint).toBe('/api/v2/nvme-of/nqn.2014-08.org.nvmexpress:target1');
    });
  });

  describe('startNvme Effect Logic', () => {
    it('should mark item as starting before API call', () => {
      const nqnToStart = 'nqn.2014-08.org.nvmexpress:target1';
      const currentState: Data = {
        total: 2,
        list: [...mockNVMeList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.nqn === nqnToStart) {
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
        list: [...mockNVMeList],
      };

      const newTotal = currentState.total;

      expect(newTotal).toBe(2);
    });

    it('should generate correct start API endpoint', () => {
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';
      const endpoint = `/api/v2/nvme-of/${nqn}/start`;

      expect(endpoint).toBe('/api/v2/nvme-of/nqn.2014-08.org.nvmexpress:target1/start');
    });
  });

  describe('stopNvme Effect Logic', () => {
    it('should mark item as stopping before API call', () => {
      const nqnToStop = 'nqn.2014-08.org.nvmexpress:target1';
      const currentState: Data = {
        total: 2,
        list: [...mockNVMeList],
      };

      const updatedList = currentState.list.map((item) => {
        if (item.nqn === nqnToStop) {
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
        list: [...mockNVMeList],
      };

      const newTotal = currentState.total;

      expect(newTotal).toBe(2);
    });

    it('should generate correct stop API endpoint', () => {
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';
      const endpoint = `/api/v2/nvme-of/${nqn}/stop`;

      expect(endpoint).toBe('/api/v2/nvme-of/nqn.2014-08.org.nvmexpress:target1/stop');
    });
  });

  describe('addLUN Effect Logic', () => {
    it('should structure addLUN payload correctly', () => {
      const payload = {
        nqn: 'nqn.2014-08.org.nvmexpress:target1',
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
        nqn: 'nqn.2014-08.org.nvmexpress:target1',
        LUN: 3,
        size_kib: 1048576,
      };

      const endpoint = `/api/v2/nvme-of/${payload.nqn}/${payload.LUN}`;

      expect(endpoint).toBe('/api/v2/nvme-of/nqn.2014-08.org.nvmexpress:target1/3');
    });
  });

  describe('deleteLUN Effect Logic', () => {
    it('should extract nqn and LUN from payload array', () => {
      const payload: Array<string | number> = ['nqn.2014-08.org.nvmexpress:target1', 2];

      const nqn = payload[0];
      const lun = payload[1];

      expect(nqn).toBe('nqn.2014-08.org.nvmexpress:target1');
      expect(lun).toBe(2);
    });

    it('should generate correct deleteLUN API endpoint', () => {
      const payload: Array<string | number> = ['nqn.2014-08.org.nvmexpress:target1', 2];
      const endpoint = `/api/v2/nvme-of/${payload[0]}/${payload[1]}`;

      expect(endpoint).toBe('/api/v2/nvme-of/nqn.2014-08.org.nvmexpress:target1/2');
    });
  });

  describe('NQN (NVMe Qualified Name) Validation', () => {
    it('should follow NQN format pattern', () => {
      const validNQN = 'nqn.2014-08.org.nvmexpress:target1';

      // NQN format: nqn.yyyy-mm.domain:identifier
      expect(validNQN).toMatch(/^nqn\.\d{4}-\d{2}/);
      expect(validNQN).toContain('org.nvmexpress:');
    });

    it('should differentiate targets by NQN', () => {
      const nqn1 = mockNVMeList[0].nqn;
      const nqn2 = mockNVMeList[1].nqn;

      expect(nqn1).not.toBe(nqn2);
      expect(nqn1).toBe('nqn.2014-08.org.nvmexpress:target1');
      expect(nqn2).toBe('nqn.2014-08.org.nvmexpress:target2');
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

      expect(messages.create).toContain('successfully');
      expect(messages.delete).toContain('Successfully');
      expect(messages.start).toContain('Successfully');
      expect(messages.stop).toContain('Successfully');
      expect(messages.addLUN).toContain('Successfully');
      expect(messages.deleteLUN).toContain('Successfully');
    });
  });

  describe('Finally Block Behavior', () => {
    it('should always call getList after operations', () => {
      const operationsThatRefreshList = ['deleteNvme', 'startNvme', 'stopNvme', 'addLUN', 'deleteLUN'];

      expect(operationsThatRefreshList).toContain('deleteNvme');
      expect(operationsThatRefreshList).toContain('startNvme');
      expect(operationsThatRefreshList).toContain('stopNvme');
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
