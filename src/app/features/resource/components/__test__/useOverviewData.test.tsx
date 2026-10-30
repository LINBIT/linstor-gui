// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api', () => ({
  getResources: vi.fn(),
}));

vi.mock('@app/features/resourceDefinition', () => ({
  getResourceDefinition: vi.fn(),
}));

import { getResources } from '../../api';
import { getResourceDefinition } from '@app/features/resourceDefinition';
import { useOverviewData } from '../overview/useOverviewData';
import { hasSyncingVolume } from '../overview/rows';
import type { ResourceDataType } from '../../types';

// The overview reads the live resource state on its own cadence: every second
// while a volume syncs, so the progress moves, and every 10 s otherwise, since
// the view holds every resource of the cluster.

const resource = (state: Record<string, unknown>) =>
  ({ name: 'r1', node_name: 'n1', volumes: [{ volume_number: 0, state }] }) as unknown as ResourceDataType;

const idle = resource({ disk_state: 'UpToDate', replication_states: { n2: { replication_state: 'Established' } } });
const syncing = resource({
  disk_state: 'UpToDate',
  replication_states: { n2: { replication_state: 'SyncSource', done_percentage: 40 } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/** How often the live state was read in the five seconds after the first read. */
const readsInFiveSeconds = async (view: ResourceDataType[]) => {
  vi.mocked(getResources).mockResolvedValue({ data: view } as never);
  renderHook(() => useOverviewData({}), { wrapper });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(50);
  });
  const first = vi.mocked(getResources).mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  return vi.mocked(getResources).mock.calls.length - first;
};

describe('useOverviewData polling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: [] } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the live state every second while a volume syncs', async () => {
    expect(await readsInFiveSeconds([syncing])).toBe(5);
  });

  it('reads it only every 10 s when nothing syncs', async () => {
    expect(await readsInFiveSeconds([idle])).toBe(0);
  });
});

describe('hasSyncingVolume', () => {
  it('is false without resources and for settled replicas', () => {
    expect(hasSyncingVolume(undefined)).toBe(false);
    expect(hasSyncingVolume([])).toBe(false);
    expect(hasSyncingVolume([idle, resource({ disk_state: 'Diskless' })])).toBe(false);
  });

  it.each(['SyncSource', 'SyncTarget', 'PausedSyncT', 'StartingSyncS', 'VerifyT', 'WFBitMapS'])(
    'is true for a peer in %s',
    (replication_state) => {
      expect(
        hasSyncingVolume([
          idle,
          resource({ disk_state: 'UpToDate', replication_states: { n2: { replication_state } } }),
        ]),
      ).toBe(true);
    },
  );

  it('is true for an Inconsistent disk, which waits for its sync', () => {
    expect(hasSyncingVolume([resource({ disk_state: 'Inconsistent' })])).toBe(true);
  });
});
