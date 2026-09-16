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
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  getVolumeDefinitionListByResource,
  updateResourceDefinition,
  cloneResourceDefinition,
  updateVolumeDefinition,
} from '../api';

const ok = { data: [{ ret_code: 1 }] };

describe('resourceDefinition api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('reads the count from stats', async () => {
    await getResourceDefinitionCount();
    expect(get).toHaveBeenCalledWith('/v1/stats/resource-definitions');
  });

  it('lists definitions with the query', async () => {
    await getResourceDefinition({ limit: 10, offset: 20, resource_definitions: ['r1'] });
    expect(get).toHaveBeenCalledWith('/v1/resource-definitions', {
      params: { query: { limit: 10, offset: 20, resource_definitions: ['r1'] } },
    });
  });

  it('creates a definition with the body', async () => {
    const body = { resource_definition: { name: 'r1', resource_group_name: 'rg1' } };
    await createResourceDefinition(body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions', { body });
  });

  it('creates a volume definition under the definition', async () => {
    const body = { volume_definition: { size_kib: 1048576 } };
    await createVolumeDefinition('r1', body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
      params: { path: { resource: 'r1' } },
      body,
    });
  });

  it('auto-places with the filter as given', async () => {
    const body = { diskless_on_remaining: true, select_filter: { place_count: 2 } };
    await autoPlace('r1', body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
      params: { path: { resource: 'r1' } },
      body,
    });
  });

  it('deletes, updates and clones by name', async () => {
    await deleteResourceDefinition('r1');
    expect(del).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', { params: { path: { resource: 'r1' } } });

    await updateResourceDefinition('r1', { override_props: { 'Aux/a': '1' } });
    expect(put).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
      params: { path: { resource: 'r1' } },
      body: { override_props: { 'Aux/a': '1' } },
    });

    await cloneResourceDefinition('r1', { name: 'r1-clone' });
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/clone', {
      params: { path: { resource: 'r1' } },
      body: { name: 'r1-clone' },
    });
  });

  it('lists and resizes volume definitions', async () => {
    await getVolumeDefinitionListByResource('r1');
    expect(get).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
      params: { path: { resource: 'r1' } },
    });

    await updateVolumeDefinition('r1', 3, { size_kib: 2048, flags: ['GROSS_SIZE'] });
    expect(put).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions/{volume_number}', {
      params: { path: { resource: 'r1', volume_number: 3 } },
      body: { size_kib: 2048, flags: ['GROSS_SIZE'] },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(getResourceDefinitionCount()).resolves.toEqual({ data: [] });
    const boom = new Error('network');
    vi.mocked(post).mockRejectedValue(boom);
    await expect(createResourceDefinition({ resource_definition: { name: 'r1' } })).rejects.toBe(boom);
  });
});
