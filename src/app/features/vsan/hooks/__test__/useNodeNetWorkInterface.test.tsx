// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useNodeNetWorkInterface } from '../useNodeNetWorkInterface';
import { getNetWorkInterfaces } from '../../api';

vi.mock('../../api', () => ({
  getNetWorkInterfaces: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useNodeNetWorkInterface', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the prefixes without the loopback one', async () => {
    vi.mocked(getNetWorkInterfaces).mockResolvedValue({
      data: {
        prefixes: [
          { prefix: '127.', mask: 8 },
          { prefix: '10.0.0.', mask: 24 },
          { prefix: '192.168.1.', mask: 16 },
        ],
      },
    } as never);

    const { result } = renderHook(() => useNodeNetWorkInterface(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([
      { prefix: '10.0.0.', mask: 24 },
      { prefix: '192.168.1.', mask: 16 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('exposes the error and no data when the request fails', async () => {
    vi.mocked(getNetWorkInterfaces).mockRejectedValue(new Error('down'));

    const { result } = renderHook(() => useNodeNetWorkInterface(), { wrapper });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toBeUndefined();
  });
});
