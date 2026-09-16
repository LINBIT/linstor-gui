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
  deleteVolumeDefinition,
} from '../api';

const ok = { data: [{ ret_code: 1 }] };

describe('volumeDefinition api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('reads the resource definition count from stats', async () => {
    await getResourceDefinitionCount();
    expect(get).toHaveBeenCalledWith('/v1/stats/resource-definitions');
  });

  it('lists resource definitions with the query', async () => {
    await getResourceDefinition({ resource_definitions: ['r1'] });
    expect(get).toHaveBeenCalledWith('/v1/resource-definitions', {
      params: { query: { resource_definitions: ['r1'] } },
    });
  });

  it('creates a resource definition with the body', async () => {
    const body = { resource_definition: { name: 'r1' } };
    await createResourceDefinition(body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions', { body });
  });

  it('creates a volume definition under the resource', async () => {
    const body = { volume_definition: { size_kib: 1048576 } };
    await createVolumeDefinition('r1', body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
      params: { path: { resource: 'r1' } },
      body,
    });
  });

  it('lists volume definitions of a resource', async () => {
    await getVolumeDefinitionListByResource('r1');
    expect(get).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions', {
      params: { path: { resource: 'r1' } },
    });
  });

  it('deletes a volume definition by resource and number', async () => {
    await deleteVolumeDefinition('r1', 2);
    expect(del).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/volume-definitions/{volume_number}', {
      params: { path: { resource: 'r1', volume_number: 2 } },
    });
  });

  it('auto-places under the resource with the body', async () => {
    const body = { select_filter: { place_count: 2 } } as Parameters<typeof autoPlace>[1];
    await autoPlace('r1', body);
    expect(post).toHaveBeenCalledWith('/v1/resource-definitions/{resource}/autoplace', {
      params: { path: { resource: 'r1' } },
      body,
    });
  });

  it('updates and deletes a resource definition by path', async () => {
    await updateResourceDefinition('r1', { override_props: { 'Aux/a': '1' } });
    expect(put).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
      params: { path: { resource: 'r1' } },
      body: { override_props: { 'Aux/a': '1' } },
    });
    await deleteResourceDefinition('r1');
    expect(del).toHaveBeenCalledWith('/v1/resource-definitions/{resource}', {
      params: { path: { resource: 'r1' } },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(createVolumeDefinition('r1', {} as Parameters<typeof createVolumeDefinition>[1])).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteVolumeDefinition('r1', 0)).rejects.toBe(boom);
  });
});
