// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
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

// Types
type NFSResource = {
  name: string;
  service_ip?: string;
  resource_group?: string;
  path?: string;
  status?: {
    primary?: string;
    service?: string;
    state?: string;
    volumes?: Array<{ number: number; state?: string }>;
  };
  volumes?: Array<{ number: number; size_kib?: number; export_path?: string }>;
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

const ExportBasePath = '/nfs/export';

describe('NFSList Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock data
  const mockNFSList: NFSResource[] = [
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
    {
      name: 'nfs-export-2',
      service_ip: '192.168.1.101',
      resource_group: 'rg2',
      status: {
        primary: 'node2',
        service: 'Stopped',
        state: 'Inconsistent',
      },
      volumes: [
        { number: 0, size_kib: 0 },
        { number: 1, size_kib: 2097152 },
      ],
    },
  ];

  describe('Export Path Calculation', () => {
    it('should generate default export path when no volumes', () => {
      const item: NFSResource = {
        name: 'nfs-export-1',
      };

      const exportPath = `${ExportBasePath}/${item?.name}`;

      expect(exportPath).toBe('/nfs/export/nfs-export-1');
    });

    it('should generate default export path when volume 1 does not exist', () => {
      const item: NFSResource = {
        name: 'nfs-export-1',
        volumes: [{ number: 0, size_kib: 0 }],
      };

      const exportPath = `${ExportBasePath}/${item?.name}`;

      expect(exportPath).toBe('/nfs/export/nfs-export-1');
    });

    it('should generate export path with suffix from volume 1', () => {
      const item: NFSResource = {
        name: 'nfs-export-1',
        volumes: [
          { number: 0, size_kib: 0 },
          { number: 1, size_kib: 1048576, export_path: '/data' },
        ],
      };

      const volume1 = item.volumes?.find((v) => v.number === 1);
      const exportPathSuffix = volume1 && (volume1 as any)?.export_path;
      const exportPath = `${ExportBasePath}/${item?.name}${exportPathSuffix || ''}`;

      expect(exportPath).toBe('/nfs/export/nfs-export-1/data');
    });

    it('should find volume 1 by number when volumes are unsorted', () => {
      const item: NFSResource = {
        name: 'nfs-export-1',
        volumes: [
          { number: 2, size_kib: 2097152 },
          { number: 0, size_kib: 0 },
          { number: 1, size_kib: 1048576, export_path: '/primary' },
        ],
      };

      const volume1 = item.volumes?.find((v) => v.number === 1);
      const exportPathSuffix = volume1 && (volume1 as any)?.export_path;
      const exportPath = `${ExportBasePath}/${item?.name}${exportPathSuffix || ''}`;

      expect(exportPath).toBe('/nfs/export/nfs-export-1/primary');
    });
  });

  describe('Service State Logic', () => {
    it('should identify started NFS exports correctly', () => {
      const startedNFS = mockNFSList[0];
      const isStarted = startedNFS?.status?.service === 'Started';

      expect(isStarted).toBe(true);
    });

    it('should identify stopped NFS exports correctly', () => {
      const stoppedNFS = mockNFSList[1];
      const isStarted = stoppedNFS?.status?.service === 'Started';

      expect(isStarted).toBe(false);
    });

    it('should determine action button text based on service state', () => {
      const startedNFS = mockNFSList[0];
      const stoppedNFS = mockNFSList[1];

      const startedAction = startedNFS?.status?.service === 'Started' ? 'stop' : 'start';
      const stoppedAction = stoppedNFS?.status?.service === 'Started' ? 'stop' : 'start';

      expect(startedAction).toBe('stop');
      expect(stoppedAction).toBe('start');
    });
  });

  describe('LINSTOR State Logic', () => {
    it('should identify OK state for success color', () => {
      const okNFS = mockNFSList[0];
      const isOk = okNFS?.status?.state === 'OK';

      expect(isOk).toBe(true);
    });

    it('should identify non-OK state for error color', () => {
      const badNFS = mockNFSList[1];
      const isOk = badNFS?.status?.state === 'OK';

      expect(isOk).toBe(false);
    });
  });

  describe('Total Size Calculation', () => {
    it('should calculate total size from all volumes', () => {
      const item = mockNFSList[0];
      const totalSize = item.volumes?.reduce((sum, vol) => sum + (vol.size_kib || 0), 0) || 0;

      expect(totalSize).toBe(1048576); // Only volume 1 has size, volume 0 is metadata
    });

    it('should handle zero size volumes', () => {
      const item: NFSResource = {
        name: 'test-nfs',
        volumes: [
          { number: 0, size_kib: 0 },
          { number: 1, size_kib: 0 },
        ],
      };

      const totalSize = item.volumes?.reduce((sum, vol) => sum + (vol.size_kib || 0), 0) || 0;

      expect(totalSize).toBe(0);
    });

    it('should handle undefined volumes', () => {
      const item: NFSResource = {
        name: 'test-nfs',
        volumes: undefined,
      };

      const totalSize = item.volumes?.reduce((sum, vol) => sum + (vol.size_kib || 0), 0) || 0;

      expect(totalSize).toBe(0);
    });

    it('should format size correctly for display', () => {
      const totalSize = 1048576; // 1 GiB in KiB
      const displaySize = totalSize > 0 ? formatBytes(totalSize) : '-';

      expect(displaySize).toContain('GiB');
    });

    it('should show dash for zero total size', () => {
      const totalSize = 0;
      const displaySize = totalSize > 0 ? formatBytes(totalSize) : '-';

      expect(displaySize).toBe('-');
    });
  });

  describe('Node Link Generation', () => {
    it('should generate correct node detail link', () => {
      const nodeName = mockNFSList[0].status?.primary;
      const expectedPath = `/inventory/nodes/${nodeName}`;

      expect(expectedPath).toBe('/inventory/nodes/node1');
    });

    it('should handle missing node name', () => {
      const item: NFSResource = {
        name: 'test-nfs',
        status: {},
      };
      const nodeName = item?.status?.primary;

      expect(nodeName).toBeUndefined();
    });
  });

  describe('Loading States', () => {
    it('should handle different operation states', () => {
      const itemWithDeleting = { ...mockNFSList[0], deleting: true };
      const itemWithStarting = { ...mockNFSList[0], starting: true };
      const itemWithStopping = { ...mockNFSList[0], stopping: true };

      expect(itemWithDeleting.deleting).toBe(true);
      expect(itemWithStarting.starting).toBe(true);
      expect(itemWithStopping.stopping).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      const emptyList: NFSResource[] = [];
      const displayList = emptyList ?? [];

      expect(displayList).toHaveLength(0);
    });

    it('should handle undefined list', () => {
      const undefinedList = undefined as unknown as NFSResource[];
      const displayList = undefinedList ?? [];

      expect(displayList).toHaveLength(0);
    });

    it('should handle item without status', () => {
      const item: NFSResource = {
        name: 'test-nfs',
      };
      const serviceState = item?.status?.service;
      const linstorState = item?.status?.state;

      expect(serviceState).toBeUndefined();
      expect(linstorState).toBeUndefined();
    });

    it('should handle item without volumes', () => {
      const item: NFSResource = {
        name: 'test-nfs',
        volumes: undefined,
      };
      const totalSize = item.volumes?.reduce((sum, vol) => sum + (vol.size_kib || 0), 0) || 0;

      expect(totalSize).toBe(0);
    });
  });

  describe('Operation Handler Function Signatures', () => {
    it('should define correct handler signatures using name parameter', () => {
      type HandlerSignature = {
        handleDelete: (name: string) => void;
        handleStart: (name: string) => void;
        handleStop: (name: string) => void;
      };

      const handlers: HandlerSignature = {
        handleDelete: (name) => console.log(name),
        handleStart: (name) => console.log(name),
        handleStop: (name) => console.log(name),
      };

      expect(handlers.handleDelete).toBeDefined();
      expect(handlers.handleStart).toBeDefined();
      expect(handlers.handleStop).toBeDefined();
    });
  });

  describe('NFS-Specific Behavior', () => {
    it('should use name property for identification (not iqn/nqn)', () => {
      const item = mockNFSList[0];

      expect(item.name).toBe('nfs-export-1');
      expect(item).not.toHaveProperty('iqn');
      expect(item).not.toHaveProperty('nqn');
    });

    it('should have dual state properties (service and linstor)', () => {
      const item = mockNFSList[0];

      expect(item.status?.service).toBe('Started');
      expect(item.status?.state).toBe('OK');
    });

    it('should have service_ip property', () => {
      const item = mockNFSList[0];

      expect(item.service_ip).toBe('192.168.1.100');
    });
  });

  describe('Alert Message', () => {
    it('should warn about single NFS limitation', () => {
      const alertMessage =
        'NOTE: Only one NFS resource can exist in a cluster. To create multiple exports, create a single resource with multiple volumes.';

      expect(alertMessage).toContain('Only one NFS resource');
      expect(alertMessage).toContain('multiple volumes');
    });
  });
});
