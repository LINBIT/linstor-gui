// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import { getEvictOutcome } from '../evict';
import type { DrbdReactorStatus } from '../api';

const makeStatus = (status: Record<string, DrbdReactorStatus>) => status;

describe('getEvictOutcome', () => {
  it('waits while the resource is still active on the original node', () => {
    const status = makeStatus({
      nodeA: {
        promoter: [{ drbd_resource: 'res1', path: '', primary_on: 'nodeA', status: 'active' }],
      },
      nodeB: {
        promoter: [{ drbd_resource: 'res1', path: '', primary_on: 'nodeA', status: 'inactive' }],
      },
    });

    expect(getEvictOutcome(status, { resourceName: 'res1', fromNode: 'nodeA' })).toEqual({ status: 'waiting' });
  });

  it('waits when no new node becomes active but the resource is still present', () => {
    const status = makeStatus({
      nodeA: {
        promoter: [{ drbd_resource: 'res1', path: '', primary_on: 'nodeA', status: 'inactive' }],
      },
      nodeB: {
        promoter: [{ drbd_resource: 'res1', path: '', primary_on: 'nodeA', status: 'inactive' }],
      },
    });

    expect(getEvictOutcome(status, { resourceName: 'res1', fromNode: 'nodeA' })).toEqual({ status: 'waiting' });
  });

  it('detects migration once another node becomes active', () => {
    const status = makeStatus({
      nodeA: {
        promoter: [{ drbd_resource: 'res1', path: '', primary_on: 'nodeA', status: 'inactive' }],
      },
      nodeB: {
        promoter: [{ drbd_resource: 'res1', path: '', primary_on: 'nodeB', status: 'active' }],
      },
    });

    expect(getEvictOutcome(status, { resourceName: 'res1', fromNode: 'nodeA' })).toEqual({
      status: 'migrated',
      newNode: 'nodeB',
    });
  });

  it('detects a full eviction once the resource disappears from all nodes', () => {
    const status = makeStatus({
      nodeA: {
        promoter: [],
      },
      nodeB: {
        promoter: [],
      },
    });

    expect(getEvictOutcome(status, { resourceName: 'res1', fromNode: 'nodeA' })).toEqual({ status: 'evicted' });
  });
});
