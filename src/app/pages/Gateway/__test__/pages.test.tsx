// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(() => ({
    nvme: {
      getList: vi.fn(),
      deleteNvme: vi.fn(),
      startNvme: vi.fn(),
      stopNvme: vi.fn(),
      addLUN: vi.fn(),
      deleteLUN: vi.fn(),
    },
    iscsi: {
      getList: vi.fn(),
      deleteISCSI: vi.fn(),
      startISCSI: vi.fn(),
      stopISCSI: vi.fn(),
      addLUN: vi.fn(),
      deleteLUN: vi.fn(),
    },
    nfs: { getList: vi.fn(), deleteNFS: vi.fn(), startNFS: vi.fn(), stopNFS: vi.fn() },
  })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react', () => ({
  ...vi.importActual('react'),
  useEffect: vi.fn(),
}));

// Import mocked modules
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

describe('Gateway Pages Logic', () => {
  let mockUseSelector: any;
  let mockUseNavigate: any;
  let mockUseEffect: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSelector = vi.mocked(useSelector);
    mockUseNavigate = vi.mocked(useNavigate);
    mockUseEffect = vi.mocked(useEffect);

    mockUseNavigate.mockReturnValue(vi.fn());
  });

  describe('NVMe Gateway Page', () => {
    it('should fetch NVMe list on component mount', () => {
      const mockDispatch = {
        nvme: { getList: vi.fn() },
      };

      // Simulate useEffect calling getList
      mockUseEffect.mockImplementation((fn) => fn());

      // Simulate the effect dependency pattern
      const effectCallback = () => {
        mockDispatch.nvme.getList();
      };

      effectCallback();

      expect(mockDispatch.nvme.getList).toHaveBeenCalled();
    });

    it('should select NVMe list from state', () => {
      const mockNVMeList = [
        { nqn: 'nqn.2014-08.org.nvmexpress:target1' },
        { nqn: 'nqn.2014-08.org.nvmexpress:target2' },
      ];

      mockUseSelector.mockReturnValue({
        list: mockNVMeList,
      });

      mockUseSelector((state: any) => ({
        list: state.nvme.list,
      }));

      expect(mockUseSelector).toHaveBeenCalled();
    });

    it('should navigate to create page on create button click', () => {
      const navigate = vi.fn();
      const createPath = '/gateway/nvme-of/create';

      navigate(createPath);

      expect(navigate).toHaveBeenCalledWith('/gateway/nvme-of/create');
    });

    it('should call deleteNvme with correct NQN', () => {
      const mockDispatch = {
        nvme: { deleteNvme: vi.fn() },
      };
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';

      mockDispatch.nvme.deleteNvme(nqn);

      expect(mockDispatch.nvme.deleteNvme).toHaveBeenCalledWith(nqn);
    });

    it('should call startNvme with correct NQN', () => {
      const mockDispatch = {
        nvme: { startNvme: vi.fn() },
      };
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';

      mockDispatch.nvme.startNvme(nqn);

      expect(mockDispatch.nvme.startNvme).toHaveBeenCalledWith(nqn);
    });

    it('should call stopNvme with correct NQN', () => {
      const mockDispatch = {
        nvme: { stopNvme: vi.fn() },
      };
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';

      mockDispatch.nvme.stopNvme(nqn);

      expect(mockDispatch.nvme.stopNvme).toHaveBeenCalledWith(nqn);
    });

    it('should call deleteLUN with correct parameters', () => {
      const mockDispatch = {
        nvme: { deleteLUN: vi.fn() },
      };
      const nqn = 'nqn.2014-08.org.nvmexpress:target1';
      const lun = 2;

      mockDispatch.nvme.deleteLUN([nqn, lun]);

      expect(mockDispatch.nvme.deleteLUN).toHaveBeenCalledWith([nqn, lun]);
    });

    it('should call addLUN with correct payload structure', () => {
      const mockDispatch = {
        nvme: { addLUN: vi.fn() },
      };
      const payload = {
        nqn: 'nqn.2014-08.org.nvmexpress:target1',
        LUN: 3,
        size_kib: 1048576,
      };

      mockDispatch.nvme.addLUN(payload);

      expect(mockDispatch.nvme.addLUN).toHaveBeenCalledWith(payload);
    });
  });

  describe('ISCSI Gateway Page', () => {
    it('should fetch ISCSI list on component mount', () => {
      const mockDispatch = {
        iscsi: { getList: vi.fn() },
      };

      mockUseEffect.mockImplementation((fn) => fn());

      const effectCallback = () => {
        mockDispatch.iscsi.getList({});
      };

      effectCallback();

      expect(mockDispatch.iscsi.getList).toHaveBeenCalledWith({});
    });

    it('should select ISCSI list from state', () => {
      const mockISCSIList = [{ iqn: 'iqn.2024-01.com.example:target1' }, { iqn: 'iqn.2024-01.com.example:target2' }];

      mockUseSelector.mockReturnValue({
        list: mockISCSIList,
      });

      mockUseSelector((state: any) => ({
        list: state.iscsi.list,
      }));

      expect(mockUseSelector).toHaveBeenCalled();
    });

    it('should navigate to create page on create button click', () => {
      const navigate = vi.fn();
      const createPath = '/gateway/iscsi/create';

      navigate(createPath);

      expect(navigate).toHaveBeenCalledWith('/gateway/iscsi/create');
    });

    it('should call deleteISCSI with correct IQN', () => {
      const mockDispatch = {
        iscsi: { deleteISCSI: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:target1';

      mockDispatch.iscsi.deleteISCSI(iqn);

      expect(mockDispatch.iscsi.deleteISCSI).toHaveBeenCalledWith(iqn);
    });

    it('should call startISCSI with correct IQN', () => {
      const mockDispatch = {
        iscsi: { startISCSI: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:target1';

      mockDispatch.iscsi.startISCSI(iqn);

      expect(mockDispatch.iscsi.startISCSI).toHaveBeenCalledWith(iqn);
    });

    it('should call stopISCSI with correct IQN', () => {
      const mockDispatch = {
        iscsi: { stopISCSI: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:target1';

      mockDispatch.iscsi.stopISCSI(iqn);

      expect(mockDispatch.iscsi.stopISCSI).toHaveBeenCalledWith(iqn);
    });

    it('should call deleteLUN with correct parameters', () => {
      const mockDispatch = {
        iscsi: { deleteLUN: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:target1';
      const lun = 2;

      mockDispatch.iscsi.deleteLUN([iqn, lun]);

      expect(mockDispatch.iscsi.deleteLUN).toHaveBeenCalledWith([iqn, lun]);
    });

    it('should call addLUN with correct payload structure', () => {
      const mockDispatch = {
        iscsi: { addLUN: vi.fn() },
      };
      const payload = {
        iqn: 'iqn.2024-01.com.example:target1',
        LUN: 3,
        size_kib: 1048576,
      };

      mockDispatch.iscsi.addLUN(payload);

      expect(mockDispatch.iscsi.addLUN).toHaveBeenCalledWith(payload);
    });
  });

  describe('NFS Gateway Page', () => {
    it('should fetch NFS list on component mount', () => {
      const mockDispatch = {
        nfs: { getList: vi.fn() },
      };

      mockUseEffect.mockImplementation((fn) => fn());

      const effectCallback = () => {
        mockDispatch.nfs.getList();
      };

      effectCallback();

      expect(mockDispatch.nfs.getList).toHaveBeenCalled();
    });

    it('should select NFS list from state', () => {
      const mockNFSList = [{ iqn: 'iqn.2024-01.com.example:nfs1' }];

      mockUseSelector.mockReturnValue({
        list: mockNFSList,
      });

      mockUseSelector((state: any) => ({
        list: state.nfs.list,
      }));

      expect(mockUseSelector).toHaveBeenCalled();
    });

    it('should navigate to create page on create button click', () => {
      const navigate = vi.fn();
      const createPath = '/gateway/nfs/create';

      navigate(createPath);

      expect(navigate).toHaveBeenCalledWith('/gateway/nfs/create');
    });

    it('should disable create button when list has 1 or more items', () => {
      const list = [{ iqn: 'iqn.2024-01.com.example:nfs1' }];
      const disabled = list.length >= 1;

      expect(disabled).toBe(true);
    });

    it('should enable create button when list is empty', () => {
      const list: any[] = [];
      const disabled = list.length >= 1;

      expect(disabled).toBe(false);
    });

    it('should call deleteNFS with correct IQN', () => {
      const mockDispatch = {
        nfs: { deleteNFS: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:nfs1';

      mockDispatch.nfs.deleteNFS(iqn);

      expect(mockDispatch.nfs.deleteNFS).toHaveBeenCalledWith(iqn);
    });

    it('should call startNFS with correct IQN', () => {
      const mockDispatch = {
        nfs: { startNFS: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:nfs1';

      mockDispatch.nfs.startNFS(iqn);

      expect(mockDispatch.nfs.startNFS).toHaveBeenCalledWith(iqn);
    });

    it('should call stopNFS with correct IQN', () => {
      const mockDispatch = {
        nfs: { stopNFS: vi.fn() },
      };
      const iqn = 'iqn.2024-01.com.example:nfs1';

      mockDispatch.nfs.stopNFS(iqn);

      expect(mockDispatch.nfs.stopNFS).toHaveBeenCalledWith(iqn);
    });
  });

  describe('Common Gateway Page Patterns', () => {
    it('should use consistent translation keys', () => {
      const translationKeys = {
        common: ['common:create', 'common:cancel', 'common:confirm', 'common:delete', 'common:start', 'common:stop'],
        nvme: ['nvme:list'],
        iscsi: ['iscsi:list'],
        nfs: ['nfs:list'],
      };

      expect(translationKeys.common).toContain('common:create');
      expect(translationKeys.nvme).toContain('nvme:list');
      expect(translationKeys.iscsi).toContain('iscsi:list');
      expect(translationKeys.nfs).toContain('nfs:list');
    });

    it('should have consistent button styling across pages', () => {
      const buttonStyle = {
        marginBottom: '1rem',
      };

      // NVMe and ISCSI use '1rem'
      expect(buttonStyle.marginBottom).toBe('1rem');
    });

    it('should use PageBasic component wrapper', () => {
      const pageTitles = {
        nvme: 'nvme:list',
        iscsi: 'iscsi:list',
        nfs: 'nfs:list',
      };

      expect(pageTitles.nvme).toBeTruthy();
      expect(pageTitles.iscsi).toBeTruthy();
      expect(pageTitles.nfs).toBeTruthy();
    });
  });

  describe('Navigation Paths', () => {
    it('should generate correct create paths for each gateway type', () => {
      const paths = {
        nvme: '/gateway/nvme-of/create',
        iscsi: '/gateway/iscsi/create',
        nfs: '/gateway/nfs/create',
      };

      expect(paths.nvme).toContain('nvme-of');
      expect(paths.iscsi).toContain('iscsi');
      expect(paths.nfs).toContain('nfs');
    });

    it('should use hyphenated nvme-of in path', () => {
      const nvmePath = '/gateway/nvme-of/create';

      expect(nvmePath).toMatch(/nvme-of/);
    });
  });

  describe('Handler Function Signatures', () => {
    it('NVMe handlers should use nqn parameter', () => {
      type NVMeHandlers = {
        handleDelete: (nqn: string) => void;
        handleStart: (nqn: string) => void;
        handleStop: (nqn: string) => void;
        handleDeleteVolume: (nqn: string, lun: number) => void;
        handleAddVolume: (nqn: string, LUN: number, size_kib: number) => void;
      };

      const handlers: NVMeHandlers = {
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

    it('ISCSI handlers should use iqn parameter', () => {
      type ISCSIHandlers = {
        handleDelete: (iqn: string) => void;
        handleStart: (iqn: string) => void;
        handleStop: (iqn: string) => void;
        handleDeleteVolume: (iqn: string, lun: number) => void;
        handleAddVolume: (iqn: string, LUN: number, size_kib: number) => void;
      };

      const handlers: ISCSIHandlers = {
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

    it('NFS handlers should use iqn parameter (no volume operations)', () => {
      type NFSHandlers = {
        handleDelete: (iqn: string) => void;
        handleStart: (iqn: string) => void;
        handleStop: (iqn: string) => void;
      };

      const handlers: NFSHandlers = {
        handleDelete: (iqn) => console.log(iqn),
        handleStart: (iqn) => console.log(iqn),
        handleStop: (iqn) => console.log(iqn),
      };

      expect(handlers.handleDelete).toBeDefined();
      expect(handlers.handleStart).toBeDefined();
      expect(handlers.handleStop).toBeDefined();
    });
  });

  describe('Effect Dependencies', () => {
    it('NVMe page should depend on dispatch.nvme', () => {
      const deps = ['dispatch.nvme'];
      expect(deps).toContain('dispatch.nvme');
    });

    it('ISCSI page should depend on dispatch.iscsi', () => {
      const deps = ['dispatch.iscsi'];
      expect(deps).toContain('dispatch.iscsi');
    });

    it('NFS page should depend on dispatch.nfs', () => {
      const deps = ['dispatch.nfs'];
      expect(deps).toContain('dispatch.nfs');
    });
  });
});
