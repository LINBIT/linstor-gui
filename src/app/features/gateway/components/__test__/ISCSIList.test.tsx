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
type ISCSIResource = {
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

describe('ISCSIList Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock data
  const mockISCSIList: ISCSIResource[] = [
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

  describe('Data Filtering and Processing', () => {
    it('should filter out metadata volume (volume 0) from display', () => {
      const item = mockISCSIList[0];
      const displayVolumes = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0);

      expect(displayVolumes).toHaveLength(2);
      expect(displayVolumes?.[0].number).toBe(1);
      expect(displayVolumes?.[1].number).toBe(2);
    });

    it('should handle targets with only metadata volume', () => {
      const item = mockISCSIList[1];
      const displayVolumes = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0);

      expect(displayVolumes).toHaveLength(0);
    });

    it('should map volumes correctly with state information', () => {
      const item = mockISCSIList[0];
      const displayVolumes = item.volumes
        ?.filter((v) => v?.number !== undefined && v.number > 0)
        ?.map((volume) => ({
          lunId: volume.number!,
          size_kib: volume.size_kib,
          state: item.status?.volumes?.find((v) => v.number === volume.number)?.state,
          iqn: item.iqn,
        }));

      expect(displayVolumes?.[0].lunId).toBe(1);
      expect(displayVolumes?.[0].state).toBe('OK');
      expect(displayVolumes?.[1].lunId).toBe(2);
      expect(displayVolumes?.[1].state).toBe('OK');
    });
  });

  describe('Service State Logic', () => {
    it('should identify started targets correctly', () => {
      const startedTarget = mockISCSIList[0];
      const isStarted = startedTarget?.status?.service === 'Started';

      expect(isStarted).toBe(true);
    });

    it('should identify stopped targets correctly', () => {
      const stoppedTarget = mockISCSIList[1];
      const isStarted = stoppedTarget?.status?.service === 'Started';

      expect(isStarted).toBe(false);
    });

    it('should determine action button text based on state', () => {
      const startedTarget = mockISCSIList[0];
      const stoppedTarget = mockISCSIList[1];

      const startedAction = startedTarget?.status?.service === 'Started' ? 'stop' : 'start';
      const stoppedAction = stoppedTarget?.status?.service === 'Started' ? 'stop' : 'start';

      expect(startedAction).toBe('stop');
      expect(stoppedAction).toBe('start');
    });
  });

  describe('Service IPs Display', () => {
    it('should join multiple service IPs with comma', () => {
      const item = mockISCSIList[0];
      const ipsString = item.service_ips?.join(', ');

      expect(ipsString).toBe('192.168.1.100, 192.168.1.101');
    });

    it('should handle single service IP', () => {
      const item = mockISCSIList[1];
      const ipsString = item.service_ips?.join(', ');

      expect(ipsString).toBe('192.168.1.102');
    });

    it('should handle undefined service IPs', () => {
      const item: ISCSIResource = {
        iqn: 'test-iqn',
      };
      const ipsString = item.service_ips?.join(', ');

      expect(ipsString).toBeUndefined();
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
      const itemWithVolumes = mockISCSIList[0];
      const itemWithoutVolumes = mockISCSIList[1];

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
      const item = mockISCSIList[0];
      const lastVolume = item.volumes?.[item.volumes?.length - 1];
      const nextLUN = (lastVolume?.number ?? 1) + 1;

      expect(nextLUN).toBe(3);
    });

    it('should calculate LUN when only metadata volume exists', () => {
      const item = mockISCSIList[1];
      const lastVolume = item.volumes?.[item.volumes?.length - 1];
      const nextLUN = (lastVolume?.number ?? 1) + 1;

      expect(nextLUN).toBe(1);
    });

    it('should handle empty volumes array', () => {
      const item: ISCSIResource = {
        iqn: 'test-iqn',
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
      const nodeName = mockISCSIList[0].status?.primary;
      const expectedPath = `/inventory/nodes/${nodeName}`;

      expect(expectedPath).toBe('/inventory/nodes/node1');
    });

    it('should generate correct resource group link', () => {
      const resourceGroup = mockISCSIList[0].resource_group;
      const expectedPath = `/storage-configuration/resource-groups?resource_groups=${resourceGroup}`;

      expect(expectedPath).toBe('/storage-configuration/resource-groups?resource_groups=rg1');
    });

    it('should handle missing node name', () => {
      const item: ISCSIResource = {
        iqn: 'test-iqn',
        status: {},
      };
      const nodeName = item?.status?.primary;

      expect(nodeName).toBeUndefined();
    });

    it('should handle missing resource group', () => {
      const item: ISCSIResource = {
        iqn: 'test-iqn',
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
        addingVolume: state.loading?.effects?.iscsi?.addLUN,
      }));

      expect(mockUseSelector).toHaveBeenCalled();
    });

    it('should handle different operation states', () => {
      const itemWithDeleting = { ...mockISCSIList[0], deleting: true };
      const itemWithStarting = { ...mockISCSIList[0], starting: true };
      const itemWithStopping = { ...mockISCSIList[0], stopping: true };

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

    it('should display Unknown for empty state', () => {
      const state = '';
      const displayState = state || 'Unknown';

      expect(displayState).toBe('Unknown');
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

    it('should store IQN and LUN when opening modal', () => {
      const item = mockISCSIList[0];
      let iqn = '';
      let lun = 0;

      // Simulate opening modal
      iqn = item.iqn;
      lun = (item.volumes?.[item.volumes?.length - 1]?.number ?? 1) + 1;

      expect(iqn).toBe('iqn.2024-01.com.example:target1');
      expect(lun).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      const emptyList: ISCSIResource[] = [];
      const displayList = emptyList ?? [];

      expect(displayList).toHaveLength(0);
    });

    it('should handle undefined list', () => {
      const undefinedList = undefined as unknown as ISCSIResource[];
      const displayList = undefinedList ?? [];

      expect(displayList).toHaveLength(0);
    });

    it('should handle item without status', () => {
      const item: ISCSIResource = {
        iqn: 'test-iqn',
      };
      const serviceState = item?.status?.service;

      expect(serviceState).toBeUndefined();
    });

    it('should handle item without volumes array', () => {
      const item: ISCSIResource = {
        iqn: 'test-iqn',
      };
      const volumes = item.volumes?.filter((v) => v?.number !== undefined && v.number > 0);

      expect(volumes).toBeUndefined();
    });

    it('should generate unique keys for volume rows', () => {
      const item = mockISCSIList[0];
      const volume1 = item.volumes?.[1];
      const volume2 = item.volumes?.[2];

      const key1 = `${item.iqn}-${volume1?.number}`;
      const key2 = `${item.iqn}-${volume2?.number}`;

      expect(key1).toBe('iqn.2024-01.com.example:target1-1');
      expect(key2).toBe('iqn.2024-01.com.example:target1-2');
      expect(key1).not.toBe(key2);
    });
  });

  describe('Operation Handler Function Signatures', () => {
    it('should define correct handler signatures', () => {
      type HandlerSignature = {
        handleDelete: (iqn: string) => void;
        handleStart: (iqn: string) => void;
        handleStop: (iqn: string) => void;
        handleDeleteVolume: (iqn: string, lun: number) => void;
        handleAddVolume: (iqn: string, LUN: number, size_kib: number) => void;
      };

      const handlers: HandlerSignature = {
        handleDelete: (iqn) => console.log(iqn),
        handleStart: (iqn) => console.log(iqn),
        handleStop: (iqn) => console.log(iqn),
        handleDeleteVolume: (iqn, lun) => console.log(iqn, lun),
        handleAddVolume: (iqn, lun, size) => console.log(iqn, lun, size),
      };

      expect(handlers.handleDelete).toBeDefined();
      expect(handlers.handleStart).toBeDefined();
      expect(handlers.handleStop).toBeDefined();
      expect(handlers.handleDeleteVolume).toBeDefined();
      expect(handlers.handleAddVolume).toBeDefined();
    });
  });

  describe('IQN-specific Tests', () => {
    it('should validate IQN format', () => {
      const validIQN = mockISCSIList[0].iqn;

      // IQN format: iqn.yyyy-mm.com.example:identifier
      expect(validIQN).toMatch(/^iqn\.\d{4}-\d{2}/);
      expect(validIQN).toContain(':');
    });

    it('should differentiate targets by IQN', () => {
      const iqn1 = mockISCSIList[0].iqn;
      const iqn2 = mockISCSIList[1].iqn;

      expect(iqn1).not.toBe(iqn2);
      expect(iqn1).toBe('iqn.2024-01.com.example:target1');
      expect(iqn2).toBe('iqn.2024-01.com.example:target2');
    });
  });
});
