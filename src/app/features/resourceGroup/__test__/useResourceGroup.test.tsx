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
  getResourceGroups: vi.fn(),
}));

import { getResourceGroups } from '../api';
import { useResourceGroups } from '../hooks/useResourceGroup';
import { DefaultResourceGroup } from '../const';

const groups = [{ name: DefaultResourceGroup }, { name: 'rg-a' }, { name: 'rg-b' }];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useResourceGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResourceGroups).mockResolvedValue({ data: groups } as never);
  });

  it('returns every group by default, including DfltRscGrp', async () => {
    const { result } = renderHook(() => useResourceGroups({}), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.map((g) => g.name)).toEqual([DefaultResourceGroup, 'rg-a', 'rg-b']);
  });

  it('drops DfltRscGrp with excludeDefault', async () => {
    const { result } = renderHook(() => useResourceGroups({ excludeDefault: true }), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.map((g) => g.name)).toEqual(['rg-a', 'rg-b']);
  });

  it('forwards the query to the api', async () => {
    const query = { resource_groups: ['rg-a'] };
    const { result } = renderHook(() => useResourceGroups({ query }), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getResourceGroups).toHaveBeenCalledWith(query);
  });

  it('surfaces the error and no data when the api rejects', async () => {
    vi.mocked(getResourceGroups).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useResourceGroups({}), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeUndefined();
  });
});
