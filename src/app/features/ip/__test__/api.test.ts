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
  createNetWorkInterface,
  updateNetWorkInterface,
  deleteNetWorkInterface,
  getNetWorkInterfaceByNode,
} from '../api';

const ok = { data: [{ ret_code: 1 }] };
const nic = { name: 'eth1', address: '10.0.0.5', satellite_port: 3366, is_active: true };

describe('ip api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: [] } as never);
    vi.mocked(post).mockResolvedValue(ok as never);
    vi.mocked(put).mockResolvedValue(ok as never);
    vi.mocked(del).mockResolvedValue(ok as never);
  });

  it('creates under the node with the body', async () => {
    await createNetWorkInterface('node-1', nic);
    expect(post).toHaveBeenCalledWith('/v1/nodes/{node}/net-interfaces', {
      params: { path: { node: 'node-1' } },
      body: nic,
    });
  });

  it('updates by node and the interface name taken from the body', async () => {
    await updateNetWorkInterface('node-1', nic);
    expect(put).toHaveBeenCalledWith('/v1/nodes/{node}/net-interfaces/{netinterface}', {
      params: { path: { node: 'node-1', netinterface: 'eth1' } },
      body: nic,
    });
  });

  it('deletes by node and interface', async () => {
    await deleteNetWorkInterface('node-1', 'eth1');
    expect(del).toHaveBeenCalledWith('/v1/nodes/{node}/net-interfaces/{netinterface}', {
      params: { path: { node: 'node-1', netinterface: 'eth1' } },
    });
  });

  it("lists a node's interfaces with an optional query", async () => {
    await getNetWorkInterfaceByNode('node-1');
    expect(get).toHaveBeenCalledWith('/v1/nodes/{node}/net-interfaces', {
      params: { path: { node: 'node-1' }, query: undefined },
    });
  });

  it('passes the transport result and rejection through', async () => {
    await expect(createNetWorkInterface('node-1', nic)).resolves.toBe(ok);
    const boom = new Error('network');
    vi.mocked(del).mockRejectedValue(boom);
    await expect(deleteNetWorkInterface('node-1', 'eth1')).rejects.toBe(boom);
  });
});
