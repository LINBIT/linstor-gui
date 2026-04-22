// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { DrbdReactorStatus } from './api';

export type EvictOutcome = { status: 'waiting' } | { status: 'migrated'; newNode: string } | { status: 'evicted' };

export const getEvictOutcome = (
  reactorStatus: Record<string, DrbdReactorStatus> | undefined,
  evictingResource: { resourceName: string; fromNode: string } | null,
): EvictOutcome => {
  if (!reactorStatus || !evictingResource) {
    return { status: 'waiting' };
  }

  const { resourceName, fromNode } = evictingResource;
  const fromNodeStatus = reactorStatus[fromNode];

  if (!fromNodeStatus) {
    return { status: 'waiting' };
  }

  const fromNodePromoter = fromNodeStatus.promoter?.find((p) => p.drbd_resource === resourceName);
  if (fromNodePromoter?.status === 'active') {
    return { status: 'waiting' };
  }

  for (const [nodeName, nodeStatus] of Object.entries(reactorStatus)) {
    if (nodeName === fromNode) {
      continue;
    }

    const activePromoter = nodeStatus.promoter?.find((p) => p.drbd_resource === resourceName && p.status === 'active');
    if (activePromoter) {
      return { status: 'migrated', newNode: nodeName };
    }
  }

  const resourceStillPresent = Object.values(reactorStatus).some((nodeStatus) =>
    nodeStatus.promoter?.some((p) => p.drbd_resource === resourceName),
  );

  if (resourceStillPresent) {
    return { status: 'waiting' };
  }

  return { status: 'evicted' };
};
