// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api', () => ({
  getFiles: vi.fn(),
  getFile: vi.fn(),
  createOrUpdateFile: vi.fn(),
  deleteFile: vi.fn(),
  deployFile: vi.fn(),
  undeployFile: vi.fn(),
}));
vi.mock('@app/features/resourceDefinition/api', () => ({
  getResourceDefinition: vi.fn(),
}));

import { getFiles, getFile, createOrUpdateFile, deleteFile, deployFile, undeployFile } from '../api';
import { getResourceDefinition } from '@app/features/resourceDefinition/api';
import {
  useFiles,
  useFile,
  useCreateOrUpdateFile,
  useDeleteFile,
  useDeployFile,
  useUndeployFile,
  useResourceDefinitions,
} from '../hooks/useFile';

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

const ok = { data: [{ ret_code: 1 }] };

describe('files hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFiles).mockResolvedValue({ data: [{ path: '/etc/a' }] } as never);
    vi.mocked(getFile).mockResolvedValue({ data: { path: '/etc/a', content: 'YQ==' } } as never);
    vi.mocked(getResourceDefinition).mockResolvedValue({ data: [{ name: 'res-a' }] } as never);
    for (const fn of [createOrUpdateFile, deleteFile, deployFile, undeployFile]) {
      vi.mocked(fn).mockResolvedValue(ok as never);
    }
  });

  it('useFiles lists files, passing the content flag through', async () => {
    const { result } = renderHook(() => useFiles(true), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getFiles).toHaveBeenCalledWith(true);
    expect(result.current.data?.data).toEqual([{ path: '/etc/a' }]);
  });

  it('useFile fetches only once it has a name', async () => {
    const { result, rerender } = renderHook(({ name }) => useFile(name), { wrapper, initialProps: { name: '' } });
    await new Promise((r) => setTimeout(r, 20));
    expect(getFile).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');

    rerender({ name: '/etc/a' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getFile).toHaveBeenCalledWith('/etc/a');
  });

  it('useResourceDefinitions asks for every definition', async () => {
    const { result } = renderHook(() => useResourceDefinitions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getResourceDefinition).toHaveBeenCalledWith({});
  });

  it('the mutations map their arguments onto the api', async () => {
    const { result } = renderHook(
      () => ({
        create: useCreateOrUpdateFile(),
        remove: useDeleteFile(),
        deploy: useDeployFile(),
        undeploy: useUndeployFile(),
      }),
      { wrapper },
    );

    await act(async () => {
      await result.current.create.mutateAsync({ extFileName: '/etc/a', body: { path: '/etc/a', content: 'YQ==' } });
      await result.current.remove.mutateAsync('/etc/a');
      await result.current.deploy.mutateAsync({ resource: 'res-a', extFileName: '/etc/a' });
      await result.current.undeploy.mutateAsync({ resource: 'res-a', extFileName: '/etc/a' });
    });

    expect(createOrUpdateFile).toHaveBeenCalledWith('/etc/a', { path: '/etc/a', content: 'YQ==' });
    expect(deleteFile).toHaveBeenCalledWith('/etc/a');
    expect(deployFile).toHaveBeenCalledWith('res-a', '/etc/a');
    expect(undeployFile).toHaveBeenCalledWith('res-a', '/etc/a');
  });
});
