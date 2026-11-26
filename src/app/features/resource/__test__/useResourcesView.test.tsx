// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api', () => ({
  getResources: vi.fn(),
}));

import { getResources } from '../api';
import { RESOURCES_VIEW_STALE_MS, useInvalidateResourcesView, useResourcesView } from '../hooks/useResourcesView';
import { useFaultyResources } from '../hooks/useFaultyResources';
import type { ResourceDataType } from '../types';

const resource = (name: string, node: string, state: Record<string, unknown>) =>
  ({ name, node_name: node, volumes: [{ volume_number: 0, state }] }) as unknown as ResourceDataType;

const healthy = resource('r1', 'n1', { disk_state: 'UpToDate' });
const faulty = { ...resource('r2', 'n2', { disk_state: 'UpToDate' }), flags: ['RSC_INACTIVE'] } as ResourceDataType;
const syncing = resource('r3', 'n1', {
  disk_state: 'UpToDate',
  replication_states: { n2: { replication_state: 'SyncSource', done_percentage: 40 } },
});

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

/** Several views of the list mounted at once, as the header and a page are. */
const renderViews = (fastWhileSyncing: boolean) =>
  renderHook(
    () => ({
      faulty: useFaultyResources(),
      onN1: useResourcesView({ select: (all) => all.filter((r) => r.node_name === 'n1') }),
      overview: useResourcesView({ fastWhileSyncing }),
    }),
    { wrapper },
  );

describe('useResourcesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches the list once for every view and gives each its own part', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [healthy, faulty] } as never);
    const { result } = renderViews(false);
    await advance(50);

    expect(getResources).toHaveBeenCalledTimes(1);
    expect(getResources).toHaveBeenCalledWith();
    expect(result.current.faulty.data?.map((r) => r.name)).toEqual(['r2']);
    expect(result.current.onN1.data?.map((r) => r.name)).toEqual(['r1']);
    expect(result.current.overview.data).toHaveLength(2);

    // One poll for all of them, every 10 s.
    await advance(10000);
    expect(getResources).toHaveBeenCalledTimes(2);
  });

  it('polls every second during a sync only when a view asks for it', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [syncing] } as never);
    renderViews(true);
    await advance(50);
    await advance(5000);
    // Still one request a second, though three views are mounted.
    expect(getResources).toHaveBeenCalledTimes(6);
  });

  it('keeps the 10 s rate during a sync when no view asks for the fast one', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [syncing] } as never);
    renderViews(false);
    await advance(50);
    await advance(5000);
    expect(getResources).toHaveBeenCalledTimes(1);
  });

  it('gives a view mounted after the first read the cached list without fetching again', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [healthy, faulty] } as never);
    // The header reads the list first...
    renderHook(() => useFaultyResources(), { wrapper });
    await advance(50);
    expect(getResources).toHaveBeenCalledTimes(1);

    // ...then a page mounts its own view of it.
    await advance(1000);
    const { result } = renderHook(() => useResourcesView(), { wrapper });
    await advance(50);
    expect(getResources).toHaveBeenCalledTimes(1);
    expect(result.current.data).toHaveLength(2);
  });

  it('fetches again for a view mounted once the cached list is stale', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [healthy] } as never);
    const first = renderHook(() => useResourcesView(), { wrapper });
    await advance(50);
    first.unmount();

    await advance(RESOURCES_VIEW_STALE_MS + 100);
    renderHook(() => useResourcesView(), { wrapper });
    await advance(50);
    expect(getResources).toHaveBeenCalledTimes(2);
  });

  it('refetches at once when a write invalidates the list inside the stale window', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [healthy] } as never);
    const { result } = renderHook(() => ({ view: useResourcesView(), invalidate: useInvalidateResourcesView() }), {
      wrapper,
    });
    await advance(50);
    expect(getResources).toHaveBeenCalledTimes(1);

    // Well inside the stale window, where a newly mounted view would not fetch.
    await advance(1000);
    expect(getResources).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.invalidate();
    });
    await advance(50);
    expect(getResources).toHaveBeenCalledTimes(2);
  });

  it('does not fetch while disabled', async () => {
    vi.mocked(getResources).mockResolvedValue({ data: [] } as never);
    renderHook(() => useResourcesView({ enabled: false }), { wrapper });
    await advance(11000);
    expect(getResources).not.toHaveBeenCalled();
  });
});
