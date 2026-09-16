// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

import { get, post, del } from '../../requests';
import {
  getRemoteList,
  createS3Remote,
  createLINSTORRemote,
  deleteRemote,
  createBackup,
  getBackup,
  deleteBackup,
} from '../api';

const ok = { data: [{ ret_code: 1 }] };

describe('remote api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: {} } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('lists every remote kind in one call', async () => {
    await getRemoteList();
    expect(get).toHaveBeenCalledWith('/v1/remotes');
  });

  // Remotes are deleted by name in the query string, not by path.
  it('deletes a remote by query param', async () => {
    await deleteRemote('s3-a');
    expect(del).toHaveBeenCalledWith('/v1/remotes', { params: { query: { remote_name: 's3-a' } } });
  });

  it('creates S3 and LINSTOR remotes on their own endpoints', async () => {
    const s3 = { remote_name: 's3-a', endpoint: 'http://minio:9000', bucket: 'b', region: 'eu', use_path_style: true };
    await createS3Remote(s3);
    expect(post).toHaveBeenCalledWith('/v1/remotes/s3', { body: s3 });
    const lin = { remote_name: 'lin-b', url: 'http://other:3370' };
    await createLINSTORRemote(lin);
    expect(post).toHaveBeenLastCalledWith('/v1/remotes/linstor', { body: lin });
  });

  it('creates, lists and deletes backups under the remote', async () => {
    await createBackup('s3-a', { rsc_name: 'r1', incremental: true });
    expect(post).toHaveBeenCalledWith('/v1/remotes/{remote_name}/backups', {
      params: { path: { remote_name: 's3-a' } },
      body: { rsc_name: 'r1', incremental: true },
    });
    await getBackup('s3-a');
    expect(get).toHaveBeenCalledWith('/v1/remotes/{remote_name}/backups', {
      params: { path: { remote_name: 's3-a' } },
    });
    await deleteBackup('s3-a', { timestamp: '20240101_120000' });
    expect(del).toHaveBeenCalledWith('/v1/remotes/{remote_name}/backups', {
      params: { path: { remote_name: 's3-a' }, query: { timestamp: '20240101_120000' } },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(createBackup('s3-a', { rsc_name: 'r1' })).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteRemote('s3-a')).rejects.toBe(boom);
  });
});
