// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vsanApi from '../api';
import service from '@app/requests';

// Mock the service module
vi.mock('@app/requests', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('VSAN API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Node Management', () => {
    it('should get nodes from VSAN', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getNodesFromVSAN();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/nodes?source=linstor');
      expect(result).toBe(mockResponse);
    });

    it('should set node standby status', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.setNodeStandBy('test-node', true);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/nodes/test-node/standby', {
        standby: true,
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle node standby false status', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.setNodeStandBy('test-node', false);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/nodes/test-node/standby', {
        standby: false,
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('NVMe Management', () => {
    it('should get NVMe-oF targets', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getNVMeoFTarget();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/nvme');
      expect(result).toBe(mockResponse);
    });

    it('should create NVMe export', () => {
      const mockResponse = { data: {} };
      const mockData = {
        nqn: 'nqn.2023-04.io.linbit:test',
        service_ip: '192.168.1.100',
        resource_group: 'test-rg',
        volumes: [{ number: 0, size_kib: 1048576 }],
        gross_size: false,
      };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.createNVMEExport(mockData);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/nvme', mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete NVMe export', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.delete).mockReturnValue(mockResponse as any);

      const result = vsanApi.deleteNVMeExport('nqn.2023-04.io.linbit:test');

      expect(service.delete).toHaveBeenCalledWith('/api/frontend/v1/nvme/nqn.2023-04.io.linbit:test');
      expect(result).toBe(mockResponse);
    });
  });

  describe('NFS Management', () => {
    it('should get NFS exports', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getNFSExport();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/nfs');
      expect(result).toBe(mockResponse);
    });

    it('should create NFS export', () => {
      const mockResponse = { data: {} };
      const mockData = {
        name: 'test-nfs',
        service_ip: '192.168.1.100',
        allowed_ips: ['192.168.1.0/24'],
        resource_group: 'test-rg',
        volumes: [{ number: 0, size_kib: 1048576, file_system: 'ext4', export_path: '/data' }],
        gross_size: false,
      };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.createNFSExport(mockData);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/nfs', mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete NFS export', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.delete).mockReturnValue(mockResponse as any);

      const result = vsanApi.deleteNFSExport('test-nfs');

      expect(service.delete).toHaveBeenCalledWith('/api/frontend/v1/nfs/test-nfs');
      expect(result).toBe(mockResponse);
    });
  });

  describe('iSCSI Management', () => {
    it('should get iSCSI targets', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getISCSITarget();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/iscsi/targets');
      expect(result).toBe(mockResponse);
    });

    it('should create iSCSI export', () => {
      const mockResponse = { data: {} };
      const mockData = {
        iqn: 'iqn.2023-04.io.linbit:test',
        allowed_initiators: ['iqn.1993-08.org.debian:test'],
        resource_group: 'test-rg',
        volumes: [{ number: 0, size_kib: 1048576 }],
        service_ips: ['192.168.1.100'],
        username: 'testuser',
        password: 'testpass',
        gross_size: false,
        implementation: 'LIO',
      };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.createISCSIExport(mockData);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/iscsi/targets', mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete iSCSI export', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.delete).mockReturnValue(mockResponse as any);

      const result = vsanApi.deleteISCISExport('test-iscsi');

      expect(service.delete).toHaveBeenCalledWith('/api/frontend/v1/iscsi/targets/test-iscsi');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Network Management', () => {
    it('should get network interfaces', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getNetWorkInterfaces();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/system/interfaces');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Resource Group Management', () => {
    it('should get resource groups', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getResourceGroups();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/linstor/resource-groups');
      expect(result).toBe(mockResponse);
    });

    it('should create resource group', () => {
      const mockResponse = { data: {} };
      const mockData = {
        name: 'test-rg',
        placeCount: 2,
        poolName: 'test-pool',
      };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.createResourceGroup(mockData);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/linstor/resource-groups', mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete resource group', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.delete).mockReturnValue(mockResponse as any);

      const result = vsanApi.deleteResourceGroup('test-rg');

      expect(service.delete).toHaveBeenCalledWith('/api/frontend/v1/linstor/resource-groups/test-rg');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Storage Management', () => {
    it('should get physical storage', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getPhysicalStorage();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/physical-storage');
      expect(result).toBe(mockResponse);
    });

    it('should get storage pools', () => {
      const mockResponse = { data: [] };
      vi.mocked(service.get).mockReturnValue(mockResponse as any);

      const result = vsanApi.getStoragePool();

      expect(service.get).toHaveBeenCalledWith('/api/frontend/v1/linstor/storage-pools');
      expect(result).toBe(mockResponse);
    });

    it('should create storage pool', () => {
      const mockResponse = { data: {} };
      const mockData = {
        poolName: 'test-pool',
        nodes: ['node1', 'node2'],
        providerKind: 'LVM',
      };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.createPool(mockData);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/linstor/physical-storage-pools', mockData);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Volume Management', () => {
    it('should resize target', () => {
      const mockResponse = { data: {} };
      const mockData = { size: 2097152 }; // 2GB in KiB
      vi.mocked(service.put).mockReturnValue(mockResponse as any);

      const result = vsanApi.resizeTarget('test-resource', mockData);

      expect(service.put).toHaveBeenCalledWith('/api/frontend/v1/linstor/resource/test-resource/resize', mockData);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in node hostnames', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.setNodeStandBy('test-node.example.com', true);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/nodes/test-node.example.com/standby', {
        standby: true,
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle special characters in NQN', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.delete).mockReturnValue(mockResponse as any);

      const nqn = 'nqn.2023-04.io.linbit:test-with-special-chars_123';
      const result = vsanApi.deleteNVMeExport(nqn);

      expect(service.delete).toHaveBeenCalledWith(`/api/frontend/v1/nvme/${nqn}`);
      expect(result).toBe(mockResponse);
    });

    it('should handle resource group names with special characters', () => {
      const mockResponse = { data: {} };
      vi.mocked(service.delete).mockReturnValue(mockResponse as any);

      const result = vsanApi.deleteResourceGroup('test-rg_with-special.chars');

      expect(service.delete).toHaveBeenCalledWith(
        '/api/frontend/v1/linstor/resource-groups/test-rg_with-special.chars',
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle empty data in createPool', () => {
      const mockResponse = { data: {} };
      const mockData = {};
      vi.mocked(service.post).mockReturnValue(mockResponse as any);

      const result = vsanApi.createPool(mockData);

      expect(service.post).toHaveBeenCalledWith('/api/frontend/v1/linstor/physical-storage-pools', mockData);
      expect(result).toBe(mockResponse);
    });
  });
});
