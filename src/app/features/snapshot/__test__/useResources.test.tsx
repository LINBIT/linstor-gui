// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@app/features/resource/api', () => ({
  getResources: vi.fn(),
}));

import { getResources } from '@app/features/resource/api';
import { useResources } from '../hooks/useResources';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResources).mockResolvedValue({
      data: [
        { name: 'r1', node_name: 'n1' },
        { name: 'r2', node_name: 'n1' },
        { name: 'r1', node_name: 'n2' },
      ],
    } as never);
  });

  it('reads the whole list once and keeps the resources on the given nodes or with the given names', async () => {
    const { result } = renderHook(() => useResources({ nodes: ['n1'] }), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data?.map((r) => r.name)).toEqual(['r1', 'r2']);
    expect(getResources).toHaveBeenCalledWith();

    const byName = renderHook(() => useResources({ resources: ['r1'] }), { wrapper });
    await waitFor(() => expect(byName.result.current.isPending).toBe(false));
    expect(byName.result.current.data?.map((r) => r.node_name)).toEqual(['n1', 'n2']);
  });

  it('keeps every resource without a filter', async () => {
    const { result } = renderHook(() => useResources(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(3));
  });

  it('reports the error when the api rejects', async () => {
    const failure = new Error('down');
    vi.mocked(getResources).mockRejectedValue(failure);
    const { result } = renderHook(() => useResources(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.data).toBeUndefined();
  });
});
