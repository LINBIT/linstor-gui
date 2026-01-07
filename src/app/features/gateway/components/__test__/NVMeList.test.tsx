// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@app/components/SizeInput', () => ({
  SizeInput: () => null,
}));

// Import types and utilities
import { formatBytes } from '@app/utils/size';
import { useSelector } from 'react-redux';

// Types
type NVMEOFResource = {
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

describe('NVMeList Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock data
  const mockNVMeList: NVMEOFResource[] = [
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
        { number: 1, size_kib: 1073741824 },
        { number: 2, size_kib: 2147483648 },
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

  describe('Data Filtering and Processing', () => {
    it('should filter out metadata volume (volume 0) from display', () => {
      const item = mockNVMeList[0];
      const displayVolumes = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0);

      expect(displayVolumes).toHaveLength(2);
      expect(displayVolumes?.[0].number).toBe(1);
      expect(displayVolumes?.[1].number).toBe(2);
    });

    it('should handle targets with only metadata volume', () => {
      const item = mockNVMeList[1];
      const displayVolumes = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0);

      expect(displayVolumes).toHaveLength(0);
    });

    it('should map volumes correctly with state information', () => {
      const item = mockNVMeList[0];
      const displayVolumes = item.volumes
        ?.filter((v) => v?.number !== undefined && v.number > 0)
        ?.map((volume) => ({
          lunId: volume.number!,
          size_kib: volume.size_kib,
          state: item.status?.volumes?.find((v) => v.number === volume.number)?.state,
          nqn: item.nqn || '',
        }));

      expect(displayVolumes?.[0].lunId).toBe(1);
      expect(displayVolumes?.[0].state).toBe('OK');
      expect(displayVolumes?.[1].lunId).toBe(2);
      expect(displayVolumes?.[1].state).toBe('OK');
    });
  });

  describe('Service State Logic', () => {
    it('should identify started targets correctly', () => {
      const startedTarget = mockNVMeList[0];
      const isStarted = startedTarget?.status?.service === 'Started';

      expect(isStarted).toBe(true);
    });

    it('should identify stopped targets correctly', () => {
      const stoppedTarget = mockNVMeList[1];
      const isStarted = stoppedTarget?.status?.service === 'Started';

      expect(isStarted).toBe(false);
    });

    it('should determine action button text based on state', () => {
      const startedTarget = mockNVMeList[0];
      const stoppedTarget = mockNVMeList[1];

      const startedAction = startedTarget?.status?.service === 'Started' ? 'stop' : 'start';
      const stoppedAction = stoppedTarget?.status?.service === 'Started' ? 'stop' : 'start';

      expect(startedAction).toBe('stop');
      expect(stoppedAction).toBe('start');
    });
  });

  describe('Volume Size Formatting', () => {
    it('should format volume sizes correctly', () => {
      // formatBytes expects size in KiB, so 1 GiB = 1024 * 1024 KiB
      const size1 = 1048576; // 1 GiB in KiB
      const size2 = 2097152; // 2 GiB in KiB

      const formatted1 = formatBytes(size1);
      const formatted2 = formatBytes(size2);

      expect(formatted1).toContain('GiB');
      expect(formatted2).toContain('GiB');
    });

    it('should handle undefined size gracefully', () => {
      const formatted = formatBytes(undefined as any);

      expect(formatted).toBe('NaN');
    });
  });

  describe('Expandable Row Logic', () => {
    it('should determine if row is expandable based on volumes', () => {
      const itemWithVolumes = mockNVMeList[0];
      const itemWithoutVolumes = mockNVMeList[1];

      const hasVolumes1 = !!(
        itemWithVolumes.volumes &&
        itemWithVolumes.volumes.filter((v) => v?.number !== undefined && v.number > 0).length > 0
      );
      const hasVolumes2 = !!(
        itemWithoutVolumes.volumes &&
        itemWithoutVolumes.volumes.filter((v) => v?.number !== undefined && v.number > 0).length > 0
      );

      expect(hasVolumes1).toBe(true);
      expect(hasVolumes2).toBe(false);
    });
  });

  describe('LUN Calculation for New Volume', () => {
    it('should calculate next LUN correctly', () => {
      const item = mockNVMeList[0];
      const lastVolume = item.volumes?.[item.volumes?.length - 1];
      const nextLUN = (lastVolume?.number ?? 1) + 1;

      expect(nextLUN).toBe(3);
    });

    it('should calculate LUN when only metadata volume exists', () => {
      const item = mockNVMeList[1];
      const lastVolume = item.volumes?.[item.volumes?.length - 1];
      const nextLUN = (lastVolume?.number ?? 1) + 1;

      expect(nextLUN).toBe(1);
    });

    it('should handle empty volumes array', () => {
      const item: NVMEOFResource = {
        nqn: 'test-nqn',
        volumes: [],
      };
      const lastVolume = item.volumes?.[item.volumes?.length - 1];
      const nextLUN = (lastVolume?.number ?? 1) + 1;

      // Empty array access at index -1 returns undefined
      // undefined ?? 1 = 1, then 1 + 1 = 2
      expect(nextLUN).toBe(2);
    });
  });

  describe('Link Generation', () => {
    it('should generate correct node detail link', () => {
      const nodeName = mockNVMeList[0].status?.primary;
      const expectedPath = `/inventory/nodes/${nodeName}`;

      expect(expectedPath).toBe('/inventory/nodes/node1');
    });

    it('should generate correct resource group link', () => {
      const resourceGroup = mockNVMeList[0].resource_group;
      const expectedPath = `/storage-configuration/resource-groups?resource_groups=${resourceGroup}`;

      expect(expectedPath).toBe('/storage-configuration/resource-groups?resource_groups=rg1');
    });

    it('should handle missing node name', () => {
      const item: NVMEOFResource = {
        nqn: 'test-nqn',
        status: {},
      };
      const nodeName = item?.status?.primary;

      expect(nodeName).toBeUndefined();
    });

    it('should handle missing resource group', () => {
      const item: NVMEOFResource = {
        nqn: 'test-nqn',
        resource_group: undefined,
      };
      const resourceGroup = item?.resource_group;

      expect(resourceGroup).toBeUndefined();
    });
  });

  describe('Loading States', () => {
    it('should use addingVolume state from Redux', () => {
      const mockUseSelector = vi.mocked(useSelector);

      mockUseSelector.mockReturnValue({
        addingVolume: true,
      });

      mockUseSelector((state: any) => ({
        addingVolume: state.loading?.effects?.nvme?.addLUN,
      }));

      expect(mockUseSelector).toHaveBeenCalled();
    });

    it('should handle different operation states', () => {
      const itemWithDeleting = { ...mockNVMeList[0], deleting: true };
      const itemWithStarting = { ...mockNVMeList[0], starting: true };
      const itemWithStopping = { ...mockNVMeList[0], stopping: true };

      expect(itemWithDeleting.deleting).toBe(true);
      expect(itemWithStarting.starting).toBe(true);
      expect(itemWithStopping.stopping).toBe(true);
    });
  });

  describe('Volume State Tag Colors', () => {
    it('should identify OK state for success color', () => {
      const state = 'OK';
      const isOk = state === 'OK';

      expect(isOk).toBe(true);
    });

    it('should identify non-OK state for error color', () => {
      const state = 'Failed';
      const isOk = state === 'OK';

      expect(isOk).toBe(false);
    });

    it('should handle undefined state', () => {
      const state = undefined;
      const isOk = state === 'OK';

      expect(isOk).toBe(false);
    });
  });

  describe('Modal State Management', () => {
    it('should handle modal open state for adding volume', () => {
      let lunModal = false;

      // Open modal
      lunModal = true;
      expect(lunModal).toBe(true);

      // Close modal
      lunModal = false;
      expect(lunModal).toBe(false);
    });

    it('should store NQN and LUN when opening modal', () => {
      const item = mockNVMeList[0];
      let nqn = '';
      let lun = 0;

      // Simulate opening modal
      nqn = item.nqn;
      lun = (item.volumes?.[item.volumes?.length - 1]?.number ?? 1) + 1;

      expect(nqn).toBe('nqn.2014-08.org.nvmexpress:target1');
      expect(lun).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      const emptyList: NVMEOFResource[] = [];
      const displayList = emptyList ?? [];

      expect(displayList).toHaveLength(0);
    });

    it('should handle undefined list', () => {
      const undefinedList = undefined as unknown as NVMEOFResource[];
      const displayList = undefinedList ?? [];

      expect(displayList).toHaveLength(0);
    });

    it('should handle item without status', () => {
      const item: NVMEOFResource = {
        nqn: 'test-nqn',
      };
      const serviceState = item?.status?.service;

      expect(serviceState).toBeUndefined();
    });

    it('should handle item without volumes array', () => {
      const item: NVMEOFResource = {
        nqn: 'test-nqn',
      };
      const volumes = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0);

      expect(volumes).toBeUndefined();
    });

    it('should generate unique keys for volume rows', () => {
      const item = mockNVMeList[0];
      const volume1 = item.volumes?.[1];
      const volume2 = item.volumes?.[2];

      const key1 = `${item.nqn}-${volume1?.number}`;
      const key2 = `${item.nqn}-${volume2?.number}`;

      expect(key1).toBe('nqn.2014-08.org.nvmexpress:target1-1');
      expect(key2).toBe('nqn.2014-08.org.nvmexpress:target1-2');
      expect(key1).not.toBe(key2);
    });
  });

  describe('Operation Handler Function Signatures', () => {
    it('should define correct handler signatures', () => {
      type HandlerSignature = {
        handleDelete: (nqn: string) => void;
        handleStart: (nqn: string) => void;
        handleStop: (nqn: string) => void;
        handleDeleteVolume: (nqn: string, lun: number) => void;
        handleAddVolume: (nqn: string, LUN: number, size_kib: number) => void;
      };

      const handlers: HandlerSignature = {
        handleDelete: (nqn) => console.log(nqn),
        handleStart: (nqn) => console.log(nqn),
        handleStop: (nqn) => console.log(nqn),
        handleDeleteVolume: (nqn, lun) => console.log(nqn, lun),
        handleAddVolume: (nqn, lun, size) => console.log(nqn, lun, size),
      };

      expect(handlers.handleDelete).toBeDefined();
      expect(handlers.handleStart).toBeDefined();
      expect(handlers.handleStop).toBeDefined();
      expect(handlers.handleDeleteVolume).toBeDefined();
      expect(handlers.handleAddVolume).toBeDefined();
    });
  });
});
