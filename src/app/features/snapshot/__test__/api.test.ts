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
  getAllResources,
  getSnapshots,
  deleteSnapshot,
  createSnapshot,
  restoreSnapshot,
  restoreVolumeDefinition,
  rollbackSnapshot,
} from '../api';

// Snapshot endpoints all hang off the resource definition, and three of them
// differ only by a path segment (restore-resource, restore-volume-definition,
// rollback). Mixing those up would still type-check, so each is asserted.

const ok = { data: [{ ret_code: 1, message: 'ok' }] };

describe('snapshot api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('lists resources through the resources view', async () => {
    const query = { nodes: ['n1'] };
    await getAllResources(query);
    expect(get).toHaveBeenCalledWith('/v1/view/resources', { params: { query } });
  });

  it('lists snapshots through the snapshots view, query optional', async () => {
    await getSnapshots();
    expect(get).toHaveBeenCalledWith('/v1/view/snapshots', { params: { query: undefined } });
    await getSnapshots({ resources: ['r1'] });
    expect(get).toHaveBeenLastCalledWith('/v1/view/snapshots', { params: { query: { resources: ['r1'] } } });
  });

  it('deletes by resource and snapshot path', async () => {
    await deleteSnapshot('r1', 's1');
    expect(del).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/snapshots/{snapshot}', {
      params: { path: { resource: 'r1', snapshot: 's1' } },
    });
  });

  it('creates under the resource with the body', async () => {
    const body = { name: 's1', nodes: ['n1'] };
    await createSnapshot('r1', body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/snapshots', {
      params: { path: { resource: 'r1' } },
      body,
    });
  });

  it('restores a resource to the target in the body', async () => {
    await restoreSnapshot('r1', 's1', { to_resource: 'r2' });
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/snapshot-restore-resource/{snapshot}', {
      params: { path: { resource: 'r1', snapshot: 's1' } },
      body: { to_resource: 'r2' },
    });
  });

  it('restores the volume definition on its own path', async () => {
    await restoreVolumeDefinition('r1', 's1', { to_resource: 'r2' });
    expect(post).toHaveBeenCalledWith(
      '/v1/resource-definitions/{resource}/snapshot-restore-volume-definition/{snapshot}',
      {
        params: { path: { resource: 'r1', snapshot: 's1' } },
        body: { to_resource: 'r2' },
      },
    );
  });

  it('rolls back with no body', async () => {
    await rollbackSnapshot('r1', 's1');
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/snapshot-rollback/{snapshot}', {
      params: { path: { resource: 'r1', snapshot: 's1' } },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(rollbackSnapshot('r1', 's1')).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(post).mockRejectedValue(boom);
    await expect(createSnapshot('r1', { name: 's1' })).rejects.toBe(boom);
  });
});
