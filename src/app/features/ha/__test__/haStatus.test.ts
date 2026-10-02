// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import {
  activeNodeInStatus,
  getConfigName,
  isResourceActiveInStatus,
  reactorConfigFiles,
  resourceNodesInStatus,
  syncEvictedResourceInStatus,
  type HARecord,
  type ReactorStatus,
} from '../haStatus';

// res1 runs on nodeB (nodeA's DRBD primary_on is stale); res2 only on nodeA, stopped.
const status: ReactorStatus = {
  nodeA: {
    promoter: [
      { drbd_resource: 'res1', path: '', primary_on: 'nodeA', status: 'inactive' },
      { drbd_resource: 'res2', path: '', primary_on: '', status: 'inactive' },
    ],
  },
  nodeB: {
    promoter: [
      {
        drbd_resource: 'res1',
        path: '',
        primary_on: 'nodeB',
        status: 'active',
        target: { name: 'drbd-services@res1.target', status: 'active', freezer: '' },
      },
    ],
  },
};

const record = (props?: Record<string, string>): HARecord => ({ name: 'res1', uuid: 'u1', props });

describe('HA status helpers', () => {
  it('finds the node whose promoter is active, not the stale DRBD primary_on', () => {
    expect(activeNodeInStatus(status, 'res1')).toBe('nodeB');
    expect(activeNodeInStatus(status, 'res2')).toBeNull();
    expect(activeNodeInStatus(undefined, 'res1')).toBeNull();
  });

  it('lists every node that reports the resource, active or not', () => {
    expect(resourceNodesInStatus(status, 'res1')).toEqual(['nodeA', 'nodeB']);
    expect(resourceNodesInStatus(status, 'res2')).toEqual(['nodeA']);
    expect(resourceNodesInStatus(status, 'other')).toEqual([]);
    expect(resourceNodesInStatus(undefined, 'res1')).toEqual([]);
  });

  it('calls a resource active when any node runs it', () => {
    expect(isResourceActiveInStatus(status, 'res1')).toBe(true);
    expect(isResourceActiveInStatus(status, 'res2')).toBe(false);
    expect(isResourceActiveInStatus(undefined, 'res1')).toBe(false);
  });

  it('takes the config name from the deployed reactor file, without path or .toml', () => {
    const props = { 'files/etc/drbd-reactor.d/mysql_config.toml': 'True', 'DrbdOptions/x': 'y' };
    expect(getConfigName(record(props))).toBe('mysql_config');
    expect(reactorConfigFiles(record(props))).toEqual(['files/etc/drbd-reactor.d/mysql_config.toml']);
    expect(getConfigName(record({ 'DrbdOptions/x': 'y' }))).toBeNull();
    expect(getConfigName(record())).toBeNull();
    expect(reactorConfigFiles(record())).toEqual([]);
  });

  it('moves an evicted resource to its new node and leaves other resources and unchanged status alone', () => {
    const next = syncEvictedResourceInStatus(status, 'res1', 'nodeA');
    expect(next?.nodeA.promoter?.[0]).toMatchObject({ primary_on: 'nodeA', status: 'active' });
    expect(next?.nodeB.promoter?.[0]).toMatchObject({
      primary_on: 'nodeA',
      status: 'inactive',
      target: { status: 'inactive' },
    });
    expect(next?.nodeA.promoter?.[1]).toBe(status.nodeA.promoter?.[1]);

    expect(syncEvictedResourceInStatus(status, 'other', 'nodeA')).toBe(status);
    expect(syncEvictedResourceInStatus(undefined, 'res1', 'nodeA')).toBeUndefined();
  });
});
