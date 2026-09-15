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
  getResourceDefinition: vi.fn(),
}));

import { getResourceDefinition } from '../api';
import { useResourceDefinitions } from '../hooks/useResourceDefinitions';

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

describe('useResourceDefinitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: [{ name: 'r1' }, { name: 'r2' }] } as never);
  });

  it('unwraps the list and forwards the query', async () => {
    const query = { resource_definitions: ['r1'] };
    const { result } = renderHook(() => useResourceDefinitions(query), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.map((r) => r.name)).toEqual(['r1', 'r2']);
    expect(getResourceDefinition).toHaveBeenCalledWith(query);
  });

  it('reports the error when the api rejects', async () => {
    vi.mocked(getResourceDefinition).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useResourceDefinitions(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeUndefined();
  });
});
