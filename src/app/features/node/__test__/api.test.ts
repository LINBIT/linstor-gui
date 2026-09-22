// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as api from '../api';
import { get, post, put, del } from '@app/features/requests';
import service from '@app/requests';

vi.mock('@app/features/requests');

vi.mock('@app/requests', () => ({
  default: { get: vi.fn() },
}));

describe('node API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the node list query through as a query param', () => {
    api.getNodes({ limit: 10, offset: 20, nodes: ['gui01'] });

    expect(get).toHaveBeenCalledWith('/v1/nodes', {
      params: { query: { limit: 10, offset: 20, nodes: ['gui01'] } },
    });
  });

  it.each([
    ['getControllerConfig', () => api.getControllerConfig(), '/v1/controller/config'],
    ['getControllerVersion', () => api.getControllerVersion(), '/v1/controller/version'],
    ['getNodeCount', () => api.getNodeCount(), '/v1/stats/nodes'],
    ['getControllerProperties', () => api.getControllerProperties(), '/v1/controller/properties'],
  ])('%s hits %s with no params', (_name, call, url) => {
    call();
    expect(get).toHaveBeenCalledWith(url);
  });

  it('reads the space report off the raw service, not the typed client', () => {
    api.getSpaceReport();

    expect(service.get).toHaveBeenCalledWith('/v1/space-report');
    expect(get).not.toHaveBeenCalled();
  });

  it('creates a node from the body alone', () => {
    const body = { name: 'gui01', type: 'Satellite' as const, net_interfaces: [] };
    api.createNode(body);

    expect(post).toHaveBeenCalledWith('/v1/nodes', { body });
  });

  it('puts the node name in the path when updating a node', () => {
    api.updateNode({ node: 'gui01', body: { node_type: 'Combined' } });

    expect(put).toHaveBeenCalledWith('/v1/nodes/{node}', {
      params: { path: { node: 'gui01' } },
      body: { node_type: 'Combined' },
    });
  });

  it('posts controller properties rather than putting them', () => {
    api.updateController({ override_props: { 'Aux/owner': 'team-a' } });

    expect(post).toHaveBeenCalledWith('/v1/controller/properties', {
      body: { override_props: { 'Aux/owner': 'team-a' } },
    });
  });

  it('deletes and loses a node on different endpoints', () => {
    api.deleteNode('gui01');
    api.lostNode('gui02');

    expect(del).toHaveBeenNthCalledWith(1, '/v1/nodes/{node}', { params: { path: { node: 'gui01' } } });
    expect(del).toHaveBeenNthCalledWith(2, '/v1/nodes/{node}/lost', { params: { path: { node: 'gui02' } } });
  });

  it('lists the interfaces of one node', () => {
    api.getNetworksByNode('gui01');

    expect(get).toHaveBeenCalledWith('/v1/nodes/{node}/net-interfaces', {
      params: { path: { node: 'gui01' } },
    });
  });

  it('carries both node and interface name into the update path', () => {
    const body = { name: 'default', address: '10.0.0.1', satellite_port: 3366 };
    api.updateNetwork({ node: 'gui01', netinterface: 'default', body });

    expect(put).toHaveBeenCalledWith('/v1/nodes/{node}/net-interfaces/{netinterface}', {
      params: { path: { node: 'gui01', netinterface: 'default' } },
      body,
    });
  });

  it('hands the caller whatever the transport returned', () => {
    const response = { data: [{ name: 'gui01' }] };
    vi.mocked(get).mockReturnValue(response as never);

    expect(api.getNodes({})).toBe(response);
  });
});
