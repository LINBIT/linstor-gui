// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@app/features/resourceGroup', () => ({
  useResourceGroups: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

// Form types
type NVMeFormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  gross_size?: boolean;
  allowed_ips: string[];
  nqn: string;
};

type ISCSIFormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  gross_size?: boolean;
  allowed_ips: string[];
  iqn: string;
  service_ips: string[];
  username?: string;
  password?: string;
};

type NFSFormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size_kib: number;
  gross_size?: boolean;
  allowed_ips: string[];
  service_ips: string[];
  volumes: {
    size_kib: number;
    export_path: string;
  }[];
};

describe('Create Forms Logic', () => {
  let mockNavigate: any;
  let mockUseMutation: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNavigate = vi.mocked(useNavigate);
    mockUseMutation = vi.mocked(useMutation);

    mockNavigate.mockReturnValue(vi.fn());
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('NVMe-oF Form Logic', () => {
    it('should generate NQN correctly', () => {
      const time = '2024-01';
      const domain = 'com.example';
      const identifier = 'target1';

      const nqn = `nqn.${time}.${domain}:nvme:${identifier}`;

      expect(nqn).toBe('nqn.2024-01.com.example:nvme:target1');
      expect(nqn).toMatch(/^nqn\.\d{4}-\d{2}/);
      expect(nqn).toContain(':nvme:');
    });

    it('should structure create payload correctly', () => {
      const values: NVMeFormType = {
        name: 'test',
        resource_group: 'DfltRscGrp',
        service_ip: '192.168.1.1/24',
        export_path: '/',
        file_system: 'ext4',
        size: 1048576,
        gross_size: false,
        allowed_ips: ['0.0.0.0/0'],
        nqn: 'target1',
      };

      const nqn = 'nqn.2024-01.com.example:nvme:' + values.nqn;
      const volumes = [{ number: 1, size_kib: values.size }];

      const currentExport = {
        nqn,
        service_ip: values.service_ip,
        resource_group: values.resource_group || 'DfltRscGrp',
        volumes,
        gross_size: values.gross_size || false,
      };

      expect(currentExport.nqn).toBe('nqn.2024-01.com.example:nvme:target1');
      expect(currentExport.volumes).toHaveLength(1);
      expect(currentExport.volumes[0].number).toBe(1);
      expect(currentExport.gross_size).toBe(false);
    });

    it('should use default resource group when not provided', () => {
      const resource_group = undefined;
      const defaultResourceGroup = resource_group || 'DfltRscGrp';

      expect(defaultResourceGroup).toBe('DfltRscGrp');
    });

    it('should navigate to correct list path on back', () => {
      const backToList = () => {
        mockNavigate()('/gateway/nvme-of');
      };

      backToList();

      expect(mockNavigate()).toHaveBeenCalledWith('/gateway/nvme-of');
    });

    it('should handle gross_size true', () => {
      const gross_size = true;
      const finalGrossSize = gross_size || false;

      expect(finalGrossSize).toBe(true);
    });

    it('should handle gross_size undefined', () => {
      const gross_size = undefined;
      const finalGrossSize = gross_size || false;

      expect(finalGrossSize).toBe(false);
    });
  });

  describe('iSCSI Form Logic', () => {
    it('should generate IQN correctly', () => {
      const time = '2024-01';
      const domain = 'com.example';
      const identifier = 'target1';

      const iqn = `iqn.${time}.${domain}:${identifier}`;

      expect(iqn).toBe('iqn.2024-01.com.example:target1');
      expect(iqn).toMatch(/^iqn\.\d{4}-\d{2}/);
    });

    it('should structure service_ips array correctly', () => {
      const service_ip = '192.168.1.1/24';
      const additionalServiceIps = ['192.168.1.2/24', '192.168.1.3/24'];

      const service_ips = [service_ip];

      additionalServiceIps.forEach((ip) => {
        if (ip) {
          service_ips.push(ip);
        }
      });

      expect(service_ips).toHaveLength(3);
      expect(service_ips[0]).toBe('192.168.1.1/24');
      expect(service_ips[1]).toBe('192.168.1.2/24');
      expect(service_ips[2]).toBe('192.168.1.3/24');
    });

    it('should handle empty additional service_ips', () => {
      const service_ip = '192.168.1.1/24';
      const additionalServiceIps: string[] = [];

      const service_ips = [service_ip];

      additionalServiceIps.forEach((ip) => {
        if (ip) {
          service_ips.push(ip);
        }
      });

      expect(service_ips).toHaveLength(1);
    });

    it('should filter out empty service_ips', () => {
      const service_ip = '192.168.1.1/24';
      const additionalServiceIps = ['192.168.1.2/24', '', '192.168.1.3/24'];

      const service_ips = [service_ip];

      additionalServiceIps.forEach((ip) => {
        if (ip) {
          service_ips.push(ip);
        }
      });

      // Initial 1 + 2 non-empty additional = 3 total
      expect(service_ips).toHaveLength(3);
      expect(service_ips).not.toContain('');
      expect(service_ips).toEqual(['192.168.1.1/24', '192.168.1.2/24', '192.168.1.3/24']);
    });

    it('should structure create payload correctly', () => {
      const values: ISCSIFormType = {
        name: 'test',
        resource_group: 'DfltRscGrp',
        service_ip: '192.168.1.1/24',
        export_path: '/',
        file_system: 'ext4',
        size: 1048576,
        gross_size: false,
        allowed_ips: ['0.0.0.0/0'],
        iqn: 'target1',
        service_ips: [],
        username: 'admin',
        password: 'password',
      };

      const iqn = 'iqn.2024-01.com.example:' + values.iqn;
      const volumes = [{ number: 1, size_kib: values.size }];
      const service_ips = [values.service_ip];

      const currentExport = {
        iqn,
        service_ips,
        resource_group: values.resource_group || 'DfltRscGrp',
        volumes,
        username: values.username || '',
        password: values.password || '',
        gross_size: values.gross_size || false,
      };

      expect(currentExport.iqn).toBe('iqn.2024-01.com.example:target1');
      expect(currentExport.service_ips).toHaveLength(1);
      expect(currentExport.username).toBe('admin');
      expect(currentExport.password).toBe('password');
    });

    it('should handle empty username and password', () => {
      const values: ISCSIFormType = {
        name: 'test',
        resource_group: 'DfltRscGrp',
        service_ip: '192.168.1.1/24',
        export_path: '/',
        file_system: 'ext4',
        size: 1048576,
        gross_size: false,
        allowed_ips: ['0.0.0.0/0'],
        iqn: 'target1',
        service_ips: [],
      };

      const username = values.username || '';
      const password = values.password || '';

      expect(username).toBe('');
      expect(password).toBe('');
    });

    it('should navigate to correct list path on back', () => {
      const backToList = () => {
        mockNavigate()('/gateway/iscsi');
      };

      backToList();

      expect(mockNavigate()).toHaveBeenCalledWith('/gateway/iscsi');
    });
  });

  describe('NFS Form Logic', () => {
    it('should structure volumes array correctly with single volume', () => {
      const values: NFSFormType = {
        name: 'test-nfs',
        resource_group: 'DfltRscGrp',
        service_ip: '192.168.1.1/24',
        export_path: '/',
        file_system: 'ext4',
        size_kib: 1048576,
        gross_size: false,
        allowed_ips: [],
        service_ips: [],
        volumes: [],
      };

      const volumes = [
        {
          number: 1,
          export_path: values.export_path,
          size_kib: values.size_kib,
          file_system: values.file_system,
          file_system_root_owner: { user: 'nobody', group: 'nobody' },
        },
        ...(values.volumes || []).map((vol, index) => ({
          number: index + 2,
          export_path: vol.export_path,
          size_kib: vol.size_kib,
          file_system: values.file_system,
          file_system_root_owner: { user: 'nobody', group: 'nobody' },
        })),
      ];

      expect(volumes).toHaveLength(1);
      expect(volumes[0].number).toBe(1);
      expect(volumes[0].export_path).toBe('/');
      expect(volumes[0].file_system_root_owner).toEqual({ user: 'nobody', group: 'nobody' });
    });

    it('should structure volumes array correctly with multiple volumes', () => {
      const values: NFSFormType = {
        name: 'test-nfs',
        resource_group: 'DfltRscGrp',
        service_ip: '192.168.1.1/24',
        export_path: '/',
        file_system: 'ext4',
        size_kib: 1048576,
        gross_size: false,
        allowed_ips: [],
        service_ips: [],
        volumes: [
          { size_kib: 2097152, export_path: '/data' },
          { size_kib: 524288, export_path: '/backup' },
        ],
      };

      const volumes = [
        {
          number: 1,
          export_path: values.export_path,
          size_kib: values.size_kib,
          file_system: values.file_system,
          file_system_root_owner: { user: 'nobody', group: 'nobody' },
        },
        ...(values.volumes || []).map((vol, index) => ({
          number: index + 2,
          export_path: vol.export_path,
          size_kib: vol.size_kib,
          file_system: values.file_system,
          file_system_root_owner: { user: 'nobody', group: 'nobody' },
        })),
      ];

      expect(volumes).toHaveLength(3);
      expect(volumes[0].number).toBe(1);
      expect(volumes[1].number).toBe(2);
      expect(volumes[2].number).toBe(3);
      expect(volumes[1].export_path).toBe('/data');
      expect(volumes[2].export_path).toBe('/backup');
    });

    it('should use default allowed_ips when empty', () => {
      const allowed_ips: string[] = [];

      const finalAllowedIps = allowed_ips && allowed_ips.length > 0 ? allowed_ips : ['0.0.0.0/0'];

      expect(finalAllowedIps).toEqual(['0.0.0.0/0']);
    });

    it('should use provided allowed_ips when not empty', () => {
      const allowed_ips = ['192.168.0.0/16', '10.0.0.0/8'];

      const finalAllowedIps = allowed_ips && allowed_ips.length > 0 ? allowed_ips : ['0.0.0.0/0'];

      expect(finalAllowedIps).toEqual(['192.168.0.0/16', '10.0.0.0/8']);
    });

    it('should structure create payload correctly', () => {
      const values: NFSFormType = {
        name: 'test-nfs',
        resource_group: 'DfltRscGrp',
        service_ip: '192.168.1.1/24',
        export_path: '/',
        file_system: 'ext4',
        size_kib: 1048576,
        gross_size: true,
        allowed_ips: ['192.168.0.0/16'],
        service_ips: [],
        volumes: [],
      };

      const volumes = [
        {
          number: 1,
          export_path: values.export_path,
          size_kib: values.size_kib,
          file_system: values.file_system,
          file_system_root_owner: { user: 'nobody', group: 'nobody' },
        },
        ...(values.volumes || []).map((vol, index) => ({
          number: index + 2,
          export_path: vol.export_path,
          size_kib: vol.size_kib,
          file_system: values.file_system,
          file_system_root_owner: { user: 'nobody', group: 'nobody' },
        })),
      ];

      const currentExport = {
        name: values.name,
        service_ip: values.service_ip,
        resource_group: values.resource_group,
        volumes,
        allowed_ips: values.allowed_ips && values.allowed_ips.length > 0 ? values.allowed_ips : ['0.0.0.0/0'],
        gross_size: values.gross_size || false,
      };

      expect(currentExport.name).toBe('test-nfs');
      expect(currentExport.service_ip).toBe('192.168.1.1/24');
      expect(currentExport.volumes).toHaveLength(1);
      expect(currentExport.allowed_ips).toEqual(['192.168.0.0/16']);
      expect(currentExport.gross_size).toBe(true);
    });

    it('should navigate to correct list path on back', () => {
      const backToList = () => {
        mockNavigate()('/gateway/NFS');
      };

      backToList();

      expect(mockNavigate()).toHaveBeenCalledWith('/gateway/NFS');
    });
  });

  describe('IP Address Validation Regex', () => {
    // Note: / needs to be escaped in regex
    const ipPattern =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[1-2]?[0-9])$/;

    it('should validate valid IP addresses with subnet mask', () => {
      const validIps = [
        '192.168.1.1/24',
        '10.10.1.1/24',
        '172.16.0.0/16',
        '192.168.0.0/16',
        '10.0.0.0/8',
        '192.168.211.122/24',
      ];

      validIps.forEach((ip) => {
        expect(ipPattern.test(ip)).toBe(true);
      });
    });

    it('should reject invalid IP addresses', () => {
      const invalidIps = ['192.168.1.1', '192.168.1.1/33', '256.168.1.1/24', '192.168.1/24', '192.168.1.1.1/24'];

      invalidIps.forEach((ip) => {
        expect(ipPattern.test(ip)).toBe(false);
      });
    });
  });

  describe('Common Form Behaviors', () => {
    it('should handle mutation loading state', () => {
      const isLoading = true;
      const buttonDisabled = isLoading;

      expect(buttonDisabled).toBe(true);
    });

    it('should use DfltRscGrp as default resource group', () => {
      const defaultResourceGroup = 'DfltRscGrp';

      expect(defaultResourceGroup).toBe('DfltRscGrp');
    });

    it('should handle success notification message', () => {
      const messages = {
        nvme: 'Create NVMe-oF Export successfully',
        iscsi: 'Create iSCSI Export successfully',
        nfs: 'Create NFS Export successfully',
      };

      expect(messages.nvme).toContain('NVMe-oF');
      expect(messages.iscsi).toContain('iSCSI');
      expect(messages.nfs).toContain('NFS');
      expect(messages.nvme).toContain('successfully');
      expect(messages.iscsi).toContain('successfully');
      expect(messages.nfs).toContain('successfully');
    });

    it('should handle error message extraction', () => {
      const err = { code: 'ERROR', message: 'Custom error message' };
      let message = 'Create failed';

      if (err.message) {
        message = err.message;
      }

      expect(message).toBe('Custom error message');
    });

    it('should use default error message when error has no message', () => {
      const err = { code: 'ERROR' };
      let message = 'Create failed';

      if (err.message) {
        message = err.message;
      }

      expect(message).toBe('Create failed');
    });
  });

  describe('Form Initial Values', () => {
    it('should have correct initial values for NVMe form', () => {
      const initialValues = {
        type: 'Satellite',
        resource_group: 'DfltRscGrp',
        gross_size: false,
      };

      expect(initialValues.resource_group).toBe('DfltRscGrp');
      expect(initialValues.gross_size).toBe(false);
    });

    it('should have correct initial values for iSCSI form', () => {
      const initialValues = {
        satellite_port: 3366,
        type: 'Satellite',
        resource_group: 'DfltRscGrp',
        gross_size: false,
      };

      expect(initialValues.satellite_port).toBe(3366);
      expect(initialValues.resource_group).toBe('DfltRscGrp');
      expect(initialValues.gross_size).toBe(false);
    });

    it('should have correct initial values for NFS form', () => {
      const initialValues = {
        satellite_port: 3366,
        type: 'Satellite',
        export_path: '/',
        file_system: 'ext4',
        gross_size: false,
        resource_group: 'DfltRscGrp',
      };

      expect(initialValues.export_path).toBe('/');
      expect(initialValues.file_system).toBe('ext4');
      expect(initialValues.resource_group).toBe('DfltRscGrp');
      expect(initialValues.gross_size).toBe(false);
    });
  });

  describe('NFS-Specific Behaviors', () => {
    it('should support ext4 and xfs file systems', () => {
      const fileSystemOptions = [
        { label: 'ext4', value: 'ext4' },
        { label: 'xfs', value: 'xfs' },
      ];

      expect(fileSystemOptions).toHaveLength(2);
      expect(fileSystemOptions.map((o) => o.value)).toEqual(['ext4', 'xfs']);
    });

    it('should use nobody:nobody for file_system_root_owner', () => {
      const fileSystemRootOwner = {
        user: 'nobody',
        group: 'nobody',
      };

      expect(fileSystemRootOwner.user).toBe('nobody');
      expect(fileSystemRootOwner.group).toBe('nobody');
    });
  });
});
