// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { get, post, put, del } from '../../requests';
import {
  deleteStoragePoolV2,
  createPhysicalStorage,
  getPhysicalStoragePoolByNode,
  createStoragePool,
  getStoragePool,
  updateStoragePool,
  getStoragePoolByNode,
  getStoragePoolCount,
} from '../api';

const ok = { data: [{ ret_code: 1 }] };

describe('storagePool api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('lists through the view with the query, and counts through stats', async () => {
    await getStoragePool({ nodes: ['node-1'], limit: 10 });
    expect(get).toHaveBeenCalledWith('/v1/view/storage-pools', { params: { query: { nodes: ['node-1'], limit: 10 } } });
    await getStoragePoolCount();
    expect(get).toHaveBeenLastCalledWith('/v1/stats/storage-pools');
  });

  it("lists one node's pools by path with an optional query", async () => {
    await getStoragePoolByNode('node-1');
    expect(get).toHaveBeenCalledWith('/v1/nodes/{node}/storage-pools', {
      params: { path: { node: 'node-1' }, query: undefined },
    });
  });

  it("lists a node's physical devices", async () => {
    await getPhysicalStoragePoolByNode({ node: 'node-1' });
    expect(get).toHaveBeenCalledWith('/v1/physical-storage/{node}', { params: { path: { node: 'node-1' } } });
  });

  it('creates physical storage under the node with the body', async () => {
    const body = {
      provider_kind: 'LVM' as const,
      raid_level: 'JBOD' as const,
      device_paths: ['/dev/sdb'],
      pool_name: 'vg0',
      sed: false,
      vdo_enable: false,
      vdo_slab_size_kib: 0,
      vdo_logical_size_kib: 0,
    };
    await createPhysicalStorage('node-1', body);
    expect(post).toHaveBeenCalledWith('/v1/physical-storage/{node}', { params: { path: { node: 'node-1' } }, body });
  });

  it('creates a pool on an existing volume group', async () => {
    const body = {
      storage_pool_name: 'p1',
      provider_kind: 'LVM_THIN' as const,
      props: { 'StorDriver/StorPoolName': 'vg0/thin' },
      external_locking: false,
    };
    await createStoragePool('node-1', body);
    expect(post).toHaveBeenCalledWith('/v1/nodes/{node}/storage-pools', { params: { path: { node: 'node-1' } }, body });
  });

  it('updates and deletes by node and pool', async () => {
    await updateStoragePool({ node: 'node-1', storagepool: 'p1' }, { override_props: { PrefNic: 'eth1' } });
    expect(put).toHaveBeenCalledWith('/v1/nodes/{node}/storage-pools/{storagepool}', {
      params: { path: { node: 'node-1', storagepool: 'p1' } },
      body: { override_props: { PrefNic: 'eth1' } },
    });
    await deleteStoragePoolV2({ node: 'node-1', storagepool: 'p1' });
    expect(del).toHaveBeenCalledWith('/v1/nodes/{node}/storage-pools/{storagepool}', {
      params: { path: { node: 'node-1', storagepool: 'p1' } },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(
      createStoragePool('node-1', { storage_pool_name: 'p', provider_kind: 'LVM', external_locking: false }),
    ).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteStoragePoolV2({ node: 'n', storagepool: 'p' })).rejects.toBe(boom);
  });
});
