// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

type Pool = { storage_pool_name?: string; node_name?: string; provider_kind?: string };
type GroupFilter = {
  select_filter?: { storage_pool?: string; storage_pool_list?: string[]; node_name_list?: string[] };
};

/**
 * The nodes a resource of this group can get a diskful replica on: those with
 * a storage pool that is not diskless, narrowed to the group's storage pools
 * and nodes when it names any. The place count cannot be higher than this.
 */
export const usableNodes = (pools: Pool[] | undefined, group: GroupFilter | undefined): string[] => {
  const filter = group?.select_filter;
  const poolNames = [filter?.storage_pool, ...(filter?.storage_pool_list ?? [])].filter(Boolean);
  const nodeNames = filter?.node_name_list ?? [];

  const nodes = (pools ?? [])
    .filter((p) => p.provider_kind !== 'DISKLESS')
    .filter((p) => poolNames.length === 0 || poolNames.includes(p.storage_pool_name))
    .filter((p) => nodeNames.length === 0 || nodeNames.includes(p.node_name ?? ''))
    .map((p) => p.node_name)
    .filter((n): n is string => Boolean(n));

  return Array.from(new Set(nodes));
};
