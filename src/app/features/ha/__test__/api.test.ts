// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../requests', () => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));
vi.mock('@app/utils/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn() },
}));

import { get, put, post, del } from '../../requests';
import { logger } from '@app/utils/logger';
import {
  getHAResourceDefinitions,
  listFiles,
  getFileContent,
  createFile,
  deployFile,
  getResources,
  getDrbdReactorStatus,
  evictDrbdReactor,
  disableDrbdReactor,
  enableDrbdReactor,
  restartDrbdReactor,
  deleteFile,
  undeployFile,
} from '../api';

const TOML = '/etc/drbd-reactor.d/mysql.toml';
const TOML_ENC = encodeURIComponent(TOML);
const ok = { data: [{ ret_code: 1 }] };

// The drbd-reactorctl calls do not go through openapi-fetch; they POST to the
// controller's exec endpoint with plain fetch.
const fetchMock = vi.fn();

describe('ha api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('LINSTOR_HOST', 'http://ctrl:3370');
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.removeItem('LINSTOR_HOST');
  });

  it('lists resource definitions with their volume definitions', async () => {
    await getHAResourceDefinitions();
    expect(get).toHaveBeenCalledWith('/v1/resource-definitions', {
      params: { query: { with_volume_definitions: true } },
    });
  });

  it('lists files and reads one by encoded path', async () => {
    await listFiles();
    expect(get).toHaveBeenCalledWith('/v1/files');
    await getFileContent(TOML);
    expect(get).toHaveBeenLastCalledWith('/v1/files/{extFileName}', { params: { path: { extFileName: TOML_ENC } } });
  });

  it('marks a reactor toml with the .disabled alt suffix, other files not', async () => {
    await createFile(TOML, 'YQ==');
    expect(put).toHaveBeenCalledWith('/v1/files/{extFileName}', {
      params: { path: { extFileName: TOML_ENC } },
      body: { path: TOML, content: 'YQ==', alt_suffixes: ['.disabled'] },
    });

    await createFile('/etc/systemd/system/x.mount', 'YQ==');
    const [, options] = vi.mocked(put).mock.calls[1];
    expect(options?.body).toEqual({ path: '/etc/systemd/system/x.mount', content: 'YQ==' });
    expect(options?.body).not.toHaveProperty('alt_suffixes');
  });

  it('deploys, undeploys and deletes with encoded paths', async () => {
    await deployFile('ha-mysql', TOML);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/files/{extFileName}', {
      params: { path: { resource: 'ha-mysql', extFileName: TOML_ENC } },
    });
    await undeployFile('ha-mysql', TOML);
    expect(del).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/files/{extFileName}', {
      params: { path: { resource: 'ha-mysql', extFileName: TOML_ENC } },
    });
    await deleteFile(TOML);
    expect(del).toHaveBeenLastCalledWith('/v1/files/{extFileName}', { params: { path: { extFileName: TOML_ENC } } });
  });

  it('reads the resources view for one resource, or all', async () => {
    await getResources('ha-mysql');
    // An array, as the schema has it; on the wire it is still resources=ha-mysql.
    expect(get).toHaveBeenCalledWith('/v1/view/resources', { params: { query: { resources: ['ha-mysql'] } } });
    await getResources();
    expect(get).toHaveBeenLastCalledWith('/v1/view/resources', { params: undefined });
  });

  describe('drbd-reactorctl exec', () => {
    it('posts to the controller host from localStorage with the nodes', async () => {
      await getDrbdReactorStatus(['node-a', 'node-b']);
      expect(fetchMock).toHaveBeenCalledWith('http://ctrl:3370/v1/nodes/exec/drbd-reactorctl/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: ['node-a', 'node-b'] }),
      });
    });

    it("parses each node's JSON status and skips failed or unparsable nodes", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            node: 'node-a',
            exit_code: 0,
            stdout_utf8: JSON.stringify({ promoter: [{ drbd_resource: 'r', status: 'active' }] }),
          },
          { node: 'node-b', exit_code: 1, stdout_utf8: '', stderr_utf8: 'no reactor' },
          { node: 'node-c', exit_code: 0, stdout_utf8: 'not json' },
        ],
      });
      const status = await getDrbdReactorStatus(['node-a', 'node-b', 'node-c']);
      expect(Object.keys(status)).toEqual(['node-a']);
      expect(status['node-a'].promoter?.[0].drbd_resource).toBe('r');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('node-c'), expect.anything());
    });

    it('sends the evict, disable, enable and restart bodies', async () => {
      await evictDrbdReactor(['node-a'], 'mysql', true);
      await disableDrbdReactor(['node-b'], 'mysql');
      await disableDrbdReactor(['node-a'], 'mysql', true);
      await enableDrbdReactor(['node-a', 'node-b'], 'mysql');
      await restartDrbdReactor(['node-a'], 'mysql');

      const calls = fetchMock.mock.calls.map(([url, init]) => [
        (url as string).replace('http://ctrl:3370/v1/nodes/exec/drbd-reactorctl/', ''),
        JSON.parse((init as RequestInit).body as string),
      ]);
      expect(calls).toEqual([
        ['evict', { nodes: ['node-a'], resource: 'mysql', wait: true }],
        ['disable', { nodes: ['node-b'], config: 'mysql', now: false }],
        ['disable', { nodes: ['node-a'], config: 'mysql', now: true }],
        ['enable', { nodes: ['node-a', 'node-b'], config: 'mysql' }],
        ['restart', { nodes: ['node-a'], config: 'mysql' }],
      ]);
    });

    it('turns a non-2xx answer into an error', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });
      await expect(evictDrbdReactor(['node-a'], 'mysql')).rejects.toThrow('Request failed: 500 Internal Server Error');
    });

    it('falls back to a relative URL without a stored host', async () => {
      localStorage.removeItem('LINSTOR_HOST');
      await enableDrbdReactor(['node-a'], 'mysql');
      expect(fetchMock.mock.calls[0][0]).toBe('/v1/nodes/exec/drbd-reactorctl/enable');
    });
  });
});
