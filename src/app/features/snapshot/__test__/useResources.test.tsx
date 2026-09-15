// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api', () => ({
  getAllResources: vi.fn(),
}));

import { getAllResources } from '../api';
import { useResources } from '../hooks/useResources';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllResources).mockResolvedValue({ data: [{ name: 'r1' }, { name: 'r2' }] } as never);
  });

  it('unwraps the data array and forwards the query', async () => {
    const query = { resources: ['r1'] };
    const { result } = renderHook(() => useResources(query), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.map((r) => r.name)).toEqual(['r1', 'r2']);
    expect(getAllResources).toHaveBeenCalledWith(query);
  });

  it('reports the error when the api rejects', async () => {
    vi.mocked(getAllResources).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useResources(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeUndefined();
  });
});
