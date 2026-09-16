// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init, type RematchDispatch, type RematchRootState } from '@rematch/core';
import type { RootModel } from '..';

// The three gateway models (nfs, iscsi, nvme) run against a real rematch
// store; only the axios service and the toast are replaced.

vi.mock('@app/requests', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@app/utils/toast', () => ({
  notify: vi.fn(),
}));

import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { nfs } from '../nfs';
import { iscsi } from '../iscsi';
import { nvme } from '../nvme';

// The three models are typed against the full RootModel; this store only
// carries the ones under test, so dispatch and state are re-typed by hand.
const makeStore = () => {
  const store = init({ models: { nfs, iscsi, nvme } as never });
  return {
    dispatch: store.dispatch as unknown as RematchDispatch<RootModel>,
    getState: () => store.getState() as unknown as RematchRootState<RootModel>,
    subscribe: store.subscribe,
  };
};
type Store = ReturnType<typeof makeStore>;

const api = vi.mocked(service);

describe('gateway models', () => {
  let store: Store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ status: 200 });
    api.put.mockResolvedValue({ status: 200 });
    api.delete.mockResolvedValue({ status: 200 });
  });

  describe('nfs', () => {
    it('getList stores the exports with their count', async () => {
      api.get.mockResolvedValue({ data: [{ name: 'nfs-a' }, { name: 'nfs-b' }] });
      await store.dispatch.nfs.getList();
      expect(api.get).toHaveBeenCalledWith('/api/v2/nfs');
      expect(store.getState().nfs).toEqual({ total: 2, list: [{ name: 'nfs-a' }, { name: 'nfs-b' }] });
    });

    it('createNFS posts the payload and reports 201 as success', async () => {
      api.post.mockResolvedValue({ status: 201 });
      const payload = {
        iqn: 'x',
        resource_group: 'rg',
        volumes: [{ number: 1, size_kib: 1 }],
        service_ips: ['10.0.0.9'],
      };
      await expect(store.dispatch.nfs.createNFS(payload)).resolves.toBe(true);
      expect(api.post).toHaveBeenCalledWith('/api/v2/nfs', payload);
      expect(notify).toHaveBeenCalledWith('Created NFS successfully', { type: 'success' });
    });

    it('createNFS surfaces the error message and resolves undefined', async () => {
      api.post.mockRejectedValue(new Error('rg missing'));
      await expect(
        store.dispatch.nfs.createNFS({ iqn: 'x', resource_group: 'rg', volumes: [], service_ips: [] }),
      ).resolves.toBeUndefined();
      expect(notify).toHaveBeenCalledWith('rg missing', { type: 'error' });
    });

    it('deleteNFS marks the row as deleting, deletes, then reloads the list even on failure', async () => {
      api.get.mockResolvedValue({ data: [{ name: 'nfs-a' }, { name: 'nfs-b' }] });
      await store.dispatch.nfs.getList();
      const seen: unknown[] = [];
      const unsubscribe = store.subscribe(() => seen.push(store.getState().nfs));

      await store.dispatch.nfs.deleteNFS('nfs-a');
      unsubscribe();

      // The optimistic flag is written before the request goes out.
      expect(seen).toContainEqual({ total: 1, list: [{ name: 'nfs-a', deleting: true }, { name: 'nfs-b' }] });
      expect(api.delete).toHaveBeenCalledWith('/api/v2/nfs/nfs-a');
      expect(notify).toHaveBeenCalledWith('Deleted Successfully', { type: 'success' });
      expect(api.get).toHaveBeenCalledTimes(2);

      api.post.mockRejectedValue(new Error('busy'));
      await store.dispatch.nfs.startNFS('nfs-b');
      expect(notify).toHaveBeenCalledWith('busy', { type: 'error' });
      expect(api.get).toHaveBeenCalledTimes(3);
    });

    it('start and stop hit their endpoints and flag the row meanwhile', async () => {
      api.get.mockResolvedValue({ data: [{ name: 'nfs-a' }] });
      await store.dispatch.nfs.getList();
      const seen: unknown[] = [];
      const unsubscribe = store.subscribe(() => seen.push(store.getState().nfs));
      await store.dispatch.nfs.startNFS('nfs-a');
      await store.dispatch.nfs.stopNFS('nfs-a');
      unsubscribe();
      expect(api.post).toHaveBeenCalledWith('/api/v2/nfs/nfs-a/start');
      expect(api.post).toHaveBeenCalledWith('/api/v2/nfs/nfs-a/stop');
      expect(seen.some((s) => JSON.stringify(s).includes('"starting":true'))).toBe(true);
      expect(seen.some((s) => JSON.stringify(s).includes('"stopping":true'))).toBe(true);
      expect(notify).toHaveBeenCalledWith('Started Successfully', { type: 'success' });
      expect(notify).toHaveBeenCalledWith('Stopped Successfully', { type: 'success' });
    });
  });

  describe('iscsi', () => {
    it('getList stores one row per target with its volumes', async () => {
      const targets = [
        { iqn: 'iqn.a', volumes: [{ number: 1 }, { number: 2 }] },
        { iqn: 'iqn.b', volumes: [{ number: 1 }] },
        { iqn: 'iqn.c' },
      ];
      api.get.mockResolvedValue({ data: targets });
      await store.dispatch.iscsi.getList();
      expect(api.get).toHaveBeenCalledWith('/api/v2/iscsi');
      expect(store.getState().iscsi).toEqual({ total: 3, list: targets });
    });

    it('create, delete, start, stop, addLUN and deleteLUN map onto the iscsi endpoints', async () => {
      api.post.mockResolvedValueOnce({ status: 201 });
      await expect(
        store.dispatch.iscsi.createISCSI({ iqn: 'iqn.a', resource_group: 'rg', volumes: [], service_ips: [] }),
      ).resolves.toBe(true);
      expect(api.post).toHaveBeenCalledWith('/api/v2/iscsi', expect.objectContaining({ iqn: 'iqn.a' }));

      await store.dispatch.iscsi.deleteISCSI('iqn.a');
      expect(api.delete).toHaveBeenCalledWith('/api/v2/iscsi/iqn.a');
      await store.dispatch.iscsi.startISCSI('iqn.a');
      expect(api.post).toHaveBeenCalledWith('/api/v2/iscsi/iqn.a/start');
      await store.dispatch.iscsi.stopISCSI('iqn.a');
      expect(api.post).toHaveBeenCalledWith('/api/v2/iscsi/iqn.a/stop');

      await store.dispatch.iscsi.addLUN({ iqn: 'iqn.a', LUN: 3, size_kib: 2048 });
      expect(api.put).toHaveBeenCalledWith('/api/v2/iscsi/iqn.a/3', { size_kib: 2048, number: 3 });
      expect(notify).toHaveBeenCalledWith('Added Successfully', { type: 'success' });

      await store.dispatch.iscsi.deleteLUN(['iqn.a', 3]);
      expect(api.delete).toHaveBeenCalledWith('/api/v2/iscsi/iqn.a/3');
      // Every mutation reloads the list.
      expect(api.get).toHaveBeenCalledTimes(5);
    });

    it('a failed LUN change is reported and still reloads', async () => {
      api.put.mockRejectedValue(new Error('no space'));
      await store.dispatch.iscsi.addLUN({ iqn: 'iqn.a', LUN: 3, size_kib: 2048 });
      expect(notify).toHaveBeenCalledWith('no space', { type: 'error' });
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('nvme', () => {
    it('getList reads the targets from the nvme-of endpoint', async () => {
      const targets = [{ nqn: 'nqn.a', volumes: [{ number: 1 }, { number: 2 }] }];
      api.get.mockResolvedValue({ data: targets });
      await store.dispatch.nvme.getList();
      expect(api.get).toHaveBeenCalledWith('/api/v2/nvme-of');
      expect(store.getState().nvme).toEqual({ total: 1, list: targets });
    });

    it('the mutations map onto the nvme-of endpoints and key rows by nqn', async () => {
      api.get.mockResolvedValue({ data: [{ nqn: 'nqn.a', volumes: [{ number: 1 }] }] });
      await store.dispatch.nvme.getList();
      const seen: unknown[] = [];
      const unsubscribe = store.subscribe(() => seen.push(store.getState().nvme));
      await store.dispatch.nvme.deleteNvme('nqn.a');
      unsubscribe();
      expect(seen.some((s) => JSON.stringify(s).includes('"deleting":true'))).toBe(true);
      expect(api.delete).toHaveBeenCalledWith('/api/v2/nvme-of/nqn.a');

      api.post.mockResolvedValueOnce({ status: 201 });
      await expect(
        store.dispatch.nvme.createNvme({ iqn: 'nqn.b', resource_group: 'rg', volumes: [], service_ips: [] }),
      ).resolves.toBe(true);
      expect(api.post).toHaveBeenCalledWith('/api/v2/nvme-of', expect.objectContaining({ iqn: 'nqn.b' }));
      await store.dispatch.nvme.startNvme('nqn.a');
      await store.dispatch.nvme.stopNvme('nqn.a');
      expect(api.post).toHaveBeenCalledWith('/api/v2/nvme-of/nqn.a/start');
      expect(api.post).toHaveBeenCalledWith('/api/v2/nvme-of/nqn.a/stop');
      await store.dispatch.nvme.addLUN({ nqn: 'nqn.a', LUN: 2, size_kib: 4096 });
      expect(api.put).toHaveBeenCalledWith('/api/v2/nvme-of/nqn.a/2', { size_kib: 4096, number: 2 });
      await store.dispatch.nvme.deleteLUN(['nqn.a', 2]);
      expect(api.delete).toHaveBeenCalledWith('/api/v2/nvme-of/nqn.a/2');
    });
  });
});
