// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@app/features/requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { get, post, put, del } from '@app/features/requests';
import { getFiles, getFile, createOrUpdateFile, deleteFile, deployFile, undeployFile } from '../api';

// External file names are absolute paths; they must reach the URL
// percent-encoded or the slashes split the path segment.
const PATH = '/etc/drbd-reactor.d/ha.toml';
const ENCODED = '%2Fetc%2Fdrbd-reactor.d%2Fha.toml';

const ok = { data: [{ ret_code: 1 }] };

describe('files api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('lists files without content by default, with it on request', async () => {
    await getFiles();
    expect(get).toHaveBeenCalledWith('/v1/files', { params: { query: { content: false } } });
    await getFiles(true);
    expect(get).toHaveBeenLastCalledWith('/v1/files', { params: { query: { content: true } } });
  });

  it('reads one file by its encoded path', async () => {
    await getFile(PATH);
    expect(get).toHaveBeenCalledWith('/v1/files/{extFileName}', { params: { path: { extFileName: ENCODED } } });
  });

  it('creates or updates with PUT on the encoded path and the body', async () => {
    const body = { path: PATH, content: 'YQ==' };
    await createOrUpdateFile(PATH, body);
    expect(put).toHaveBeenCalledWith('/v1/files/{extFileName}', {
      params: { path: { extFileName: ENCODED } },
      body,
    });
  });

  it('deletes by encoded path', async () => {
    await deleteFile(PATH);
    expect(del).toHaveBeenCalledWith('/v1/files/{extFileName}', { params: { path: { extFileName: ENCODED } } });
  });

  it('deploys and undeploys under the resource definition', async () => {
    await deployFile('res-a', PATH);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/files/{extFileName}', {
      params: { path: { resource: 'res-a', extFileName: ENCODED } },
    });
    await undeployFile('res-a', PATH);
    expect(del).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/files/{extFileName}', {
      params: { path: { resource: 'res-a', extFileName: ENCODED } },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(deployFile('res-a', PATH)).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteFile(PATH)).rejects.toBe(boom);
  });
});
