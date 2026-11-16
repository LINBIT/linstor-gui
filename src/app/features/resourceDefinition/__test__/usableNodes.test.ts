// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { usableNodes } from '../usableNodes';

const pools = [
  { storage_pool_name: 'sp1', node_name: 'n1', provider_kind: 'LVM_THIN' },
  { storage_pool_name: 'sp2', node_name: 'n1', provider_kind: 'ZFS' },
  { storage_pool_name: 'sp1', node_name: 'n2', provider_kind: 'LVM_THIN' },
  { storage_pool_name: 'sp2', node_name: 'n3', provider_kind: 'ZFS' },
  { storage_pool_name: 'DfltDisklessStorPool', node_name: 'n4', provider_kind: 'DISKLESS' },
];

describe('usableNodes', () => {
  it('counts each node with a diskful pool once, never a diskless-only node', () => {
    expect(usableNodes(pools, undefined)).toEqual(['n1', 'n2', 'n3']);
    expect(usableNodes(pools, { select_filter: {} })).toEqual(['n1', 'n2', 'n3']);
  });

  it("keeps to the group's storage pool or pool list", () => {
    expect(usableNodes(pools, { select_filter: { storage_pool: 'sp2' } })).toEqual(['n1', 'n3']);
    expect(usableNodes(pools, { select_filter: { storage_pool_list: ['sp1'] } })).toEqual(['n1', 'n2']);
  });

  it("keeps to the group's nodes", () => {
    expect(usableNodes(pools, { select_filter: { node_name_list: ['n2', 'n4'] } })).toEqual(['n2']);
  });

  it('has no nodes without pools', () => {
    expect(usableNodes(undefined, undefined)).toEqual([]);
  });
});
