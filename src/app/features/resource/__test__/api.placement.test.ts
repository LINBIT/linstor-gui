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

import { get, post, put } from '../../requests';
import {
  getResourcesByResourceName,
  adjustResourceGroup,
  toggleResource,
  createResourceOnNode,
  makeResourceAvailable,
} from '../api';

// The placement helpers api.test.ts does not reach: the toggle-disk pair,
// the diskless/pool shaping of createResourceOnNode and make-available.

const ok = { data: [{ ret_code: 1 }] };

describe('resource api: placement helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
  });

  it('lists the resources of one definition by path', async () => {
    await getResourcesByResourceName('res-a');
    expect(get).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources', {
      params: { path: { resource: 'res-a' } },
    });
  });

  it('adjusts a resource group with an empty POST', async () => {
    await adjustResourceGroup({ resource_group: 'rg-1' });
    expect(post).toHaveBeenCalledWith('/v1/resource-groups/{resource_group}/adjust', {
      params: { path: { resource_group: 'rg-1' } },
    });
  });

  it('toggles to diskful and to diskless on their own paths', async () => {
    await toggleResource('res-a', 'node-1', 'to_diskful');
    expect(put).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}/toggle-disk/diskful', {
      params: { path: { resource: 'res-a', node: 'node-1' } },
    });
    await toggleResource('res-a', 'node-1', 'to_diskless');
    expect(put).toHaveBeenLastCalledWith('/v1/resource-definitions/{resource}/resources/{node}/toggle-disk/diskless', {
      params: { path: { resource: 'res-a', node: 'node-1' } },
    });
  });

  it('createResourceOnNode sends the pool as a prop, or the DRBD_DISKLESS flag, or neither', async () => {
    await createResourceOnNode('res-a', 'node-1', false, 'pool-a');
    await createResourceOnNode('res-a', 'node-2', true, 'pool-a');
    await createResourceOnNode('res-a', 'node-3');

    const bodies = vi.mocked(post).mock.calls.map(([, opts]) => (opts as { body: unknown }).body);
    expect(bodies).toEqual([
      { resource: { name: 'res-a', node_name: 'node-1', props: { StorPoolName: 'pool-a' } } },
      { resource: { name: 'res-a', node_name: 'node-2', flags: ['DRBD_DISKLESS'] } },
      { resource: { name: 'res-a', node_name: 'node-3' } },
    ]);
    expect(vi.mocked(post).mock.calls[0][0]).toBe('/v1/resource-definitions/{resource}/resources/{node}');
  });

  it('make-available carries the diskful choice in the body', async () => {
    await makeResourceAvailable('res-a', 'node-3', true);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/resources/{node}/make-available', {
      params: { path: { resource: 'res-a', node: 'node-3' } },
      body: { diskful: true },
    });
  });
});
