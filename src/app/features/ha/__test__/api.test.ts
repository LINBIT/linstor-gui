// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../requests', async (importOriginal) => ({
  // The real unwrap: the exec calls rely on it to turn an error reply into a throw.
  unwrap: (await importOriginal<typeof import('../../requests')>()).unwrap,
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

describe('ha api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
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
    const exec = (path: string) => `/v1/nodes/exec/drbd-reactorctl/${path}`;

    it('posts the nodes to the status endpoint through the typed client', async () => {
      await getDrbdReactorStatus(['node-a', 'node-b']);
      expect(post).toHaveBeenCalledWith(exec('status'), { body: { nodes: ['node-a', 'node-b'], wait: false } });
    });

    it("parses each node's JSON status and skips failed or unparsable nodes", async () => {
      vi.mocked(post).mockResolvedValue({
        data: [
          {
            node: 'node-a',
            exit_code: 0,
            stdout_utf8: JSON.stringify({ promoter: [{ drbd_resource: 'r', status: 'active' }] }),
          },
          { node: 'node-b', exit_code: 1, stdout_utf8: '', stderr_utf8: 'no reactor' },
          { node: 'node-c', exit_code: 0, stdout_utf8: 'not json' },
        ],
      } as never);
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

      expect(vi.mocked(post).mock.calls).toEqual([
        [exec('evict'), { body: { nodes: ['node-a'], resource: 'mysql', wait: true } }],
        [exec('disable'), { body: { nodes: ['node-b'], config: 'mysql', now: false } }],
        [exec('disable'), { body: { nodes: ['node-a'], config: 'mysql', now: true } }],
        [exec('enable'), { body: { nodes: ['node-a', 'node-b'], config: 'mysql', now: false } }],
        [exec('restart'), { body: { nodes: ['node-a'], config: 'mysql', now: false } }],
      ]);
    });

    it('turns an error reply into an error', async () => {
      vi.mocked(post).mockResolvedValue({
        error: [{ ret_code: -1, message: 'node-a is offline' }],
        response: { ok: false, status: 500 },
      } as never);
      await expect(evictDrbdReactor(['node-a'], 'mysql')).rejects.toThrow('node-a is offline');
    });
  });
});
