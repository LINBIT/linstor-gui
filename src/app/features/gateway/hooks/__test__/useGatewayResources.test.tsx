// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import service from '@app/requests';
import { notify } from '@app/utils/toast';
import { GatewayKind, useGatewayResources } from '../useGatewayResources';

vi.mock('@app/requests', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@app/utils/toast', () => ({ notify: vi.fn() }));

type Row = { name: string };
const nameOf = (row: Row) => row.name;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const setup = async (kind: GatewayKind = 'iscsi') => {
  const hook = renderHook(() => useGatewayResources<Row>(kind, nameOf), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useGatewayResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(service.get).mockResolvedValue({ data: [{ name: 'a' }, { name: 'b' }] });
  });

  it.each<GatewayKind>(['nfs', 'iscsi', 'nvme-of'])('fetches the %s list from its gateway URL', async (kind) => {
    const { result } = await setup(kind);

    expect(service.get).toHaveBeenCalledWith(`/api/v2/${kind}`);
    expect(result.current.total).toBe(2);
    expect(result.current.list).toEqual([
      { name: 'a', starting: false, stopping: false },
      { name: 'b', starting: false, stopping: false },
    ]);
  });

  it('treats an empty response body as an empty list', async () => {
    vi.mocked(service.get).mockResolvedValue({ data: undefined });
    const { result } = await setup();

    expect(result.current.list).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it.each([
    ['start', 'starting', 'Started Successfully'],
    ['stop', 'stopping', 'Stopped Successfully'],
  ] as const)('%s flags the row while in flight, then reloads and toasts', async (action, flag, message) => {
    const { result } = await setup('nfs');
    const call = deferred<{ status: number }>();
    vi.mocked(service.post).mockReturnValue(call.promise);

    let done!: Promise<void>;
    act(() => {
      done = result.current[action]('a');
    });

    expect(service.post).toHaveBeenCalledWith(`/api/v2/nfs/a/${action}`);
    await waitFor(() => expect(result.current.list[0][flag]).toBe(true));
    expect(result.current.list[1][flag]).toBe(false);

    await act(async () => {
      call.resolve({ status: 200 });
      await done;
    });

    expect(notify).toHaveBeenCalledWith(message, { type: 'success' });
    expect(service.get).toHaveBeenCalledTimes(2);
    expect(result.current.list[0][flag]).toBe(false);
  });

  it('toasts the error of a failed start and still reloads', async () => {
    const { result } = await setup();
    vi.mocked(service.post).mockRejectedValue(new Error('target busy'));

    await act(() => result.current.start('a'));

    expect(notify).toHaveBeenCalledWith('target busy', { type: 'error' });
    expect(notify).not.toHaveBeenCalledWith(expect.anything(), { type: 'success' });
    expect(service.get).toHaveBeenCalledTimes(2);
    expect(result.current.list[0].starting).toBe(false);
  });

  it('adds a LUN with the gateway payload and reports addingVolume while in flight', async () => {
    const { result } = await setup('nvme-of');
    const call = deferred<{ status: number }>();
    vi.mocked(service.put).mockReturnValue(call.promise);

    expect(result.current.addingVolume).toBe(false);

    let done!: Promise<void>;
    act(() => {
      done = result.current.addLUN({ id: 'nqn.x', lun: 3, sizeKib: 1048576 });
    });

    expect(service.put).toHaveBeenCalledWith('/api/v2/nvme-of/nqn.x/3', { size_kib: 1048576, number: 3 });
    expect(result.current.addingVolume).toBe(true);

    await act(async () => {
      call.resolve({ status: 200 });
      await done;
    });

    expect(result.current.addingVolume).toBe(false);
    expect(notify).toHaveBeenCalledWith('Added Successfully', { type: 'success' });
    expect(service.get).toHaveBeenCalledTimes(2);
  });

  it('deletes a LUN by id and number, then reloads and toasts', async () => {
    const { result } = await setup('iscsi');
    vi.mocked(service.delete).mockResolvedValue({ status: 200 });

    await act(() => result.current.deleteLUN('iqn.x', 2));

    expect(service.delete).toHaveBeenCalledWith('/api/v2/iscsi/iqn.x/2');
    expect(notify).toHaveBeenCalledWith('Deleted Successfully', { type: 'success' });
    expect(service.get).toHaveBeenCalledTimes(2);
  });

  it('remove only issues the DELETE and passes a failure to the caller', async () => {
    const { result } = await setup('nfs');
    vi.mocked(service.delete).mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      await result.current.remove('a');
    });

    expect(service.delete).toHaveBeenCalledWith('/api/v2/nfs/a');
    expect(notify).not.toHaveBeenCalled();
    expect(service.get).toHaveBeenCalledTimes(1);

    vi.mocked(service.delete).mockRejectedValueOnce(new Error('in use'));
    await expect(result.current.remove('b')).rejects.toThrow('in use');
    expect(notify).not.toHaveBeenCalled();
  });

  it('reload refetches the list', async () => {
    const { result } = await setup();

    await act(() => result.current.reload());

    expect(service.get).toHaveBeenCalledTimes(2);
  });
});
