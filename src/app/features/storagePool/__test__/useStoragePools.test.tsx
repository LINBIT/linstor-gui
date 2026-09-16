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
  getStoragePool: vi.fn(),
}));

import { getStoragePool } from '../api';
import { useStoragePools } from '../hooks/useStoragePools';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
        logger: { log: () => {}, warn: () => {}, error: () => {} },
      })
    }
  >
    {children}
  </QueryClientProvider>
);

describe('useStoragePools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoragePool).mockResolvedValue({ data: [{ storage_pool_name: 'p1' }] } as never);
  });

  it('unwraps the list and forwards the query', async () => {
    const { result } = renderHook(() => useStoragePools({ nodes: ['node-1'] }), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([{ storage_pool_name: 'p1' }]);
    expect(getStoragePool).toHaveBeenCalledWith({ nodes: ['node-1'] });
  });

  it('reports the error when the api rejects', async () => {
    vi.mocked(getStoragePool).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useStoragePools(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeUndefined();
  });
});
