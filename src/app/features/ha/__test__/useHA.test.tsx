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
  getHAResourceDefinitions: vi.fn(),
  listFiles: vi.fn(),
  getFileContent: vi.fn(),
  createFile: vi.fn(),
  deployFile: vi.fn(),
  getResources: vi.fn(),
  getDrbdReactorStatus: vi.fn(),
  evictDrbdReactor: vi.fn(),
  disableDrbdReactor: vi.fn(),
  enableDrbdReactor: vi.fn(),
  restartDrbdReactor: vi.fn(),
  deleteFile: vi.fn(),
  undeployFile: vi.fn(),
}));

import {
  getHAResourceDefinitions,
  getFileContent,
  getDrbdReactorStatus,
  deployFile,
  deleteFile,
  undeployFile,
  createFile,
  evictDrbdReactor,
} from '../api';
import {
  useHA,
  hasHAConfig,
  useFileContent,
  useDrbdReactorStatus,
  useDeleteHA,
  useCreateFile,
  useDeployFile,
  useManageHA,
  useUnmanageHA,
  useEvictDrbdReactor,
} from '../useHA';

const HA_KEY = 'files/etc/drbd-reactor.d/mysql.toml';

const makeClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const wrapperFor = (client: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

describe('ha hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getHAResourceDefinitions).mockResolvedValue({
      data: [
        { name: 'ha-mysql', uuid: 'u1', props: { [HA_KEY]: '', 'Aux/x': '1' } },
        { name: 'plain', uuid: 'u2', props: { 'Aux/x': '1' } },
        { name: 'no-props', uuid: 'u3' },
      ],
    } as never);
    vi.mocked(getFileContent).mockResolvedValue({ data: { content: 'YQ==' } } as never);
    vi.mocked(getDrbdReactorStatus).mockResolvedValue({} as never);
    for (const fn of [deployFile, deleteFile, undeployFile, createFile]) {
      vi.mocked(fn).mockResolvedValue({ data: [] } as never);
    }
    vi.mocked(evictDrbdReactor).mockResolvedValue([] as never);
  });

  it('hasHAConfig looks for a deployed reactor config prop', () => {
    expect(hasHAConfig({ [HA_KEY]: '' })).toBe(true);
    expect(hasHAConfig({ 'files/etc/other.conf': '' })).toBe(false);
    expect(hasHAConfig(undefined)).toBe(false);
  });

  it('useHA keeps only resource definitions with a reactor config', async () => {
    const { result } = renderHook(() => useHA(), { wrapper: wrapperFor(makeClient()) });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data.map((rd) => rd.name)).toEqual(['ha-mysql']);
  });

  it('useFileContent turns the prop key into an absolute file path', async () => {
    const { result } = renderHook(() => useFileContent(HA_KEY), { wrapper: wrapperFor(makeClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getFileContent).toHaveBeenCalledWith('/etc/drbd-reactor.d/mysql.toml');
  });

  it('useFileContent stays idle without a path', async () => {
    const { result } = renderHook(() => useFileContent(''), { wrapper: wrapperFor(makeClient()) });
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.fetchStatus).toBe('idle');
    expect(getFileContent).not.toHaveBeenCalled();
  });

  it('useDrbdReactorStatus only asks once there are nodes', async () => {
    const client = makeClient();
    const { result, rerender } = renderHook(({ nodes }) => useDrbdReactorStatus(nodes), {
      wrapper: wrapperFor(client),
      initialProps: { nodes: [] as string[] },
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(getDrbdReactorStatus).not.toHaveBeenCalled();
    rerender({ nodes: ['node-a'] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getDrbdReactorStatus).toHaveBeenCalledWith(['node-a']);
  });

  it('useDeleteHA undeploys before it deletes, then drops the cached lists', async () => {
    const client = makeClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteHA(), { wrapper: wrapperFor(client) });
    await act(async () => {
      await result.current.mutateAsync({ resourceName: 'ha-mysql', filePath: '/etc/drbd-reactor.d/mysql.toml' });
    });
    expect(undeployFile).toHaveBeenCalledWith('ha-mysql', '/etc/drbd-reactor.d/mysql.toml');
    expect(deleteFile).toHaveBeenCalledWith('/etc/drbd-reactor.d/mysql.toml');
    expect(vi.mocked(undeployFile).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deleteFile).mock.invocationCallOrder[0],
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ha-resource-definitions'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['ha-all-resource-definitions'] });
  });

  it('useDeleteHA does not delete the file when the undeploy fails', async () => {
    vi.mocked(undeployFile).mockRejectedValue(new Error('still deployed'));
    const { result } = renderHook(() => useDeleteHA(), { wrapper: wrapperFor(makeClient()) });
    await act(async () => {
      await result.current.mutateAsync({ resourceName: 'ha-mysql', filePath: '/x' }).catch(() => undefined);
    });
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('useDeleteHA stops on an undeploy that answers with an error body', async () => {
    // openapi-fetch resolves on HTTP errors; the failure is in `error`.
    vi.mocked(undeployFile).mockResolvedValue({
      error: [{ ret_code: -1, message: 'resource is in use' }],
    } as unknown as Awaited<ReturnType<typeof undeployFile>>);
    const { result } = renderHook(() => useDeleteHA(), { wrapper: wrapperFor(makeClient()) });
    let failure: unknown;
    await act(async () => {
      await result.current.mutateAsync({ resourceName: 'ha-mysql', filePath: '/x' }).catch((e) => (failure = e));
    });
    expect(deleteFile).not.toHaveBeenCalled();
    expect((failure as Error).message).toBe('resource is in use');
  });

  it('useCreateFile and useEvictDrbdReactor forward their arguments and refresh', async () => {
    const client = makeClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => ({ create: useCreateFile(), evict: useEvictDrbdReactor() }), {
      wrapper: wrapperFor(client),
    });
    await act(async () => {
      await result.current.create.mutateAsync({ filePath: '/etc/drbd-reactor.d/a.toml', content: 'YQ==' });
      await result.current.evict.mutateAsync({ nodes: ['node-a'], resource: 'a', wait: true });
    });
    expect(createFile).toHaveBeenCalledWith('/etc/drbd-reactor.d/a.toml', 'YQ==');
    expect(evictDrbdReactor).toHaveBeenCalledWith(['node-a'], 'a', true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['drbd-reactor-status'] });
  });

  it('create, deploy, manage and unmanage reject a refused request instead of reporting success', async () => {
    // A satellite without the directory in allowExtFiles answers 403 with an ApiCallRc list.
    const refused = {
      error: [{ ret_code: -1, message: 'The path /etc/drbd-reactor.d/a.toml does not have a whitelisted parent' }],
    } as never;
    for (const fn of [createFile, deployFile, undeployFile]) {
      vi.mocked(fn).mockResolvedValue(refused);
    }
    const { result } = renderHook(
      () => ({ create: useCreateFile(), deploy: useDeployFile(), manage: useManageHA(), unmanage: useUnmanageHA() }),
      { wrapper: wrapperFor(makeClient()) },
    );
    const args = { resourceName: 'a', filePath: '/etc/drbd-reactor.d/a.toml' };
    const failures: string[] = [];
    await act(async () => {
      for (const run of [
        () => result.current.create.mutateAsync({ filePath: args.filePath, content: 'YQ==' }),
        () => result.current.deploy.mutateAsync(args),
        () => result.current.manage.mutateAsync(args),
        () => result.current.unmanage.mutateAsync(args),
      ]) {
        await run().catch((e: Error) => failures.push(e.message));
      }
    });
    expect(failures).toHaveLength(4);
    expect(failures[0]).toMatch(/whitelisted parent/);
  });

  it('a created file refreshes the file list, which decides what is unmanaged', async () => {
    const client = makeClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateFile(), { wrapper: wrapperFor(client) });
    await act(async () => {
      await result.current.mutateAsync({ filePath: '/etc/drbd-reactor.d/a.toml', content: 'YQ==' });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['linstor-files'] });
  });
});
