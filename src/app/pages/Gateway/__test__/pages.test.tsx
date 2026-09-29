// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { useGatewayResources } from '@app/features/gateway/hooks/useGatewayResources';
import NFSPage from '../nfs';
import ISCSIPage from '../iscsi';
import NVMePage from '../nvme';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@app/features/gateway/hooks/useGatewayResources', () => ({ useGatewayResources: vi.fn() }));

// The lists are covered by their own tests; here they only expose the props the pages wire up.
const listProps: Record<string, Record<string, any>> = {};
vi.mock('@app/features/gateway', () => {
  const stub = (name: string) => (props: Record<string, unknown>) => {
    listProps[name] = props;
    return <div data-testid={name} />;
  };
  return { NFSList: stub('nfs'), ISCSIList: stub('iscsi'), NVMeList: stub('nvme') };
});

const makeHook = () => ({
  list: [{ name: 'r1', starting: false, stopping: false }],
  total: 1,
  loading: true,
  reload: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  remove: vi.fn(() => Promise.resolve()),
  addLUN: vi.fn(),
  addingVolume: true,
  deleteLUN: vi.fn(),
});

let hook: ReturnType<typeof makeHook>;

describe('Gateway list pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook = makeHook();
    vi.mocked(useGatewayResources).mockReturnValue(hook as never);
  });

  describe('NFS', () => {
    it('loads the nfs kind keyed by name and passes list state down', () => {
      render(<NFSPage />);

      expect(screen.getByText('nfs:list')).toBeInTheDocument();
      const [kind, idOf] = vi.mocked(useGatewayResources).mock.calls[0];
      expect(kind).toBe('nfs');
      expect(idOf({ name: 'export1' } as never)).toBe('export1');

      const props = listProps.nfs;
      expect(props.list).toBe(hook.list);
      expect(props.loading).toBe(true);
      expect(props.handleDelete).toBe(hook.remove);
      expect(props.onDeleted).toBe(hook.reload);
      expect(props).not.toHaveProperty('addingVolume');
    });

    it('wires start, stop and create', () => {
      render(<NFSPage />);
      const props = listProps.nfs;

      props.handleStart('export1');
      props.handleStop('export1');
      props.onCreate();

      expect(hook.start).toHaveBeenCalledWith('export1');
      expect(hook.stop).toHaveBeenCalledWith('export1');
      expect(navigate).toHaveBeenCalledWith('/gateway/nfs/create');
    });
  });

  describe.each([
    ['iscsi', ISCSIPage, 'iqn', 'iqn.2024-01.com.example:t1', 'iscsi:list', '/gateway/iscsi/create'],
    ['nvme', NVMePage, 'nqn', 'nqn.2014-08.org.nvmexpress:t1', 'nvme:list', '/gateway/nvme-of/create'],
  ] as const)('%s', (name, Page, idField, id, title, createPath) => {
    const kind = name === 'nvme' ? 'nvme-of' : name;

    it(`loads the ${kind} kind keyed by ${idField} and passes list state down`, () => {
      render(<Page />);

      expect(screen.getByText(title)).toBeInTheDocument();
      const [calledKind, idOf] = vi.mocked(useGatewayResources).mock.calls[0];
      expect(calledKind).toBe(kind);
      expect(idOf({ [idField]: id } as never)).toBe(id);

      const props = listProps[name];
      expect(props.list).toBe(hook.list);
      expect(props.loading).toBe(true);
      expect(props.addingVolume).toBe(true);
      expect(props.handleDelete).toBe(hook.remove);
      expect(props.onDeleted).toBe(hook.reload);
    });

    it('wires start, stop and create', () => {
      render(<Page />);
      const props = listProps[name];

      props.handleStart(id);
      props.handleStop(id);
      props.onCreate();

      expect(hook.start).toHaveBeenCalledWith(id);
      expect(hook.stop).toHaveBeenCalledWith(id);
      expect(navigate).toHaveBeenCalledWith(createPath);
    });

    it('maps volume add/delete onto the hook payloads', () => {
      render(<Page />);
      const props = listProps[name];

      props.handleAddVolume(id, 3, 1048576);
      props.handleDeleteVolume(id, 2);

      expect(hook.addLUN).toHaveBeenCalledWith({ id, lun: 3, sizeKib: 1048576 });
      expect(hook.deleteLUN).toHaveBeenCalledWith(id, 2);
    });
  });
});
