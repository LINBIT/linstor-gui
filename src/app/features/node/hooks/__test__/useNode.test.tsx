// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useNodes } from '../useNode';
import { getNodes } from '../../api';

vi.mock('../../api', () => ({ getNodes: vi.fn() }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useNodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps the response body and passes the query along', async () => {
    const nodes = [{ name: 'gui01' }];
    vi.mocked(getNodes).mockResolvedValue({ data: nodes } as never);

    const { result } = renderHook(() => useNodes({ nodes: ['gui01'] }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe(nodes));
    expect(getNodes).toHaveBeenCalledWith({ nodes: ['gui01'] });
  });

  it('leaves data undefined and reports the error when the call fails', async () => {
    vi.mocked(getNodes).mockRejectedValue(new Error('controller down'));

    const { result } = renderHook(() => useNodes(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeUndefined();
  });

  it('refetches on demand', async () => {
    vi.mocked(getNodes).mockResolvedValue({ data: [] } as never);
    const { result } = renderHook(() => useNodes(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.refetch();

    expect(getNodes).toHaveBeenCalledTimes(2);
  });
});
