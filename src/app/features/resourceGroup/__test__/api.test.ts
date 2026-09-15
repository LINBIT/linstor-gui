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
import {
  getResourceGroups,
  getResourceGroupCount,
  getResourceGroupVolumeGroups,
  createResourceGroup,
  deleteResourceGroup,
  updateResourceGroup,
  spawnResourceGroup,
  addVolumeToResourceGroup,
} from '../api';

// The API layer is a thin mapping from function arguments onto openapi-fetch
// calls. What can go wrong is the path template, where an argument lands
// (path vs body vs query), and a forgotten argument — so that is what each
// test pins down.

const ok = { data: [{ ret_code: 1, message: 'ok' }] };

describe('resourceGroup api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('lists resource groups with the query as query params', async () => {
    const query = { limit: 10, offset: 20, resource_groups: ['rg1'] };
    await getResourceGroups(query);
    expect(get).toHaveBeenCalledWith('/v1/resource-groups', { params: { query } });
  });

  it('reads the count from the stats endpoint', async () => {
    await getResourceGroupCount();
    expect(get).toHaveBeenCalledWith('/v1/stats/resource-groups');
  });

  it('reads volume groups of one resource group by path', async () => {
    await getResourceGroupVolumeGroups('rg1');
    expect(get).toHaveBeenCalledWith('/v1/resource-groups/{resource_group}/volume-groups', {
      params: { path: { resource_group: 'rg1' } },
    });
  });

  it('creates with the whole body', async () => {
    const body = { name: 'rg1', description: 'for tests' };
    await createResourceGroup(body);
    expect(post).toHaveBeenCalledWith('/v1/resource-groups', { body });
  });

  it('deletes by path', async () => {
    await deleteResourceGroup('rg1');
    expect(del).toHaveBeenCalledWith('/v1/resource-groups/{resource_group}', {
      params: { path: { resource_group: 'rg1' } },
    });
  });

  it('updates by path with the modify body', async () => {
    const body = { description: 'd', override_props: { 'Aux/x': '1' } };
    await updateResourceGroup('rg1', body);
    expect(put).toHaveBeenCalledWith('/v1/resource-groups/{resource_group}', {
      params: { path: { resource_group: 'rg1' } },
      body,
    });
  });

  it('spawns under the resource group path', async () => {
    const body = { resource_definition_name: 'r1', volume_sizes: [1048576], partial: false, definitions_only: false };
    await spawnResourceGroup('rg1', body);
    expect(post).toHaveBeenCalledWith('/v1/resource-groups/{resource_group}/spawn', {
      params: { path: { resource_group: 'rg1' } },
      body,
    });
  });

  it('adds a volume group under the resource group path', async () => {
    await addVolumeToResourceGroup('rg1', { volume_number: 3 });
    expect(post).toHaveBeenCalledWith('/v1/resource-groups/{resource_group}/volume-groups', {
      params: { path: { resource_group: 'rg1' } },
      body: { volume_number: 3 },
    });
  });

  it('passes the transport result straight through', async () => {
    await expect(createResourceGroup({ name: 'rg1', description: '' })).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteResourceGroup('rg1')).rejects.toBe(boom);
  });
});
