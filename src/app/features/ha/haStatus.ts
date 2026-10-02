// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { DrbdReactorStatus } from './api';

export interface HARecord {
  name: string;
  uuid: string;
  props?: Record<string, string>;
  layer_data?: Array<{
    type: string;
    data?: Record<string, unknown>;
  }>;
  resource_group_name?: string;
  volume_definitions?: Array<{
    volume_number: number;
    size_kib: number;
    props?: Record<string, string>;
    uuid: string;
    layer_data?: Array<{
      type: string;
      data?: Record<string, unknown>;
    }>;
  }>;
}

export type PromoterEntry = NonNullable<DrbdReactorStatus['promoter']>[number];

export type ReactorStatus = Record<string, DrbdReactorStatus>;

/** The resource's deployed drbd-reactor config files (external-file props). */
export const reactorConfigFiles = (record: HARecord) =>
  Object.keys(record.props || {}).filter((key) => key.startsWith('files/etc/drbd-reactor.d/'));

export const decodeExecText = (text?: string | null): string => {
  if (!text) return '';
  return text;
};

/**
 * Extract the drbd-reactorctl config name from the resource's LINSTOR props.
 * The prop key has the form "files/etc/drbd-reactor.d/<config>.toml".
 * drbd-reactorctl evict takes the config name (without path or extension).
 */
export const getConfigName = (record: HARecord): string | null => {
  if (!record.props) return null;
  const key = Object.keys(record.props).find((k) => k.startsWith('files/etc/drbd-reactor.d/'));
  if (!key) return null;
  // key = "files/etc/drbd-reactor.d/mysql_config.toml"
  const filename = key.split('/').pop() ?? '';
  return filename.replace(/\.toml$/, '') || null;
};

// Get the node that is actively running the resource (status === 'active').
// We key on the map entry (node name) rather than the promoter.primary_on field
// because primary_on reflects the DRBD-level primary, which may still be set
// even when the DRBD Reactor service stack has failed/gone inactive — sending
// evict to such a node would result in a 500 from the backend.
export const activeNodeInStatus = (status: ReactorStatus | undefined, resourceName: string): string | null => {
  if (!status) {
    return null;
  }
  for (const [nodeName, nodeStatus] of Object.entries(status)) {
    const activePromoter = nodeStatus.promoter?.find((p) => p.drbd_resource === resourceName && p.status === 'active');
    if (activePromoter) {
      return nodeName;
    }
  }
  return null;
};

/**
 * Get all nodes where the resource is present (either active or inactive).
 */
export const resourceNodesInStatus = (status: ReactorStatus | undefined, resourceName: string): string[] => {
  if (!status) return [];
  const nodes: string[] = [];
  for (const [nodeName, nodeStatus] of Object.entries(status)) {
    const promoter = nodeStatus.promoter?.find((p) => p.drbd_resource === resourceName);
    if (promoter) {
      nodes.push(nodeName);
    }
  }
  return nodes;
};

export const syncEvictedResourceInStatus = (
  status: ReactorStatus | undefined,
  resourceName: string,
  activeNode: string,
): ReactorStatus | undefined => {
  if (!status) {
    return status;
  }

  let changed = false;
  const nextStatus = Object.fromEntries(
    Object.entries(status).map(([nodeName, nodeStatus]) => {
      const promoter = nodeStatus.promoter;
      if (!promoter?.some((item) => item.drbd_resource === resourceName)) {
        return [nodeName, nodeStatus];
      }

      changed = true;
      return [
        nodeName,
        {
          ...nodeStatus,
          promoter: promoter.map((item) =>
            item.drbd_resource === resourceName
              ? {
                  ...item,
                  primary_on: activeNode,
                  status: nodeName === activeNode ? 'active' : 'inactive',
                  target: item.target
                    ? {
                        ...item.target,
                        status: nodeName === activeNode ? 'active' : 'inactive',
                      }
                    : item.target,
                }
              : item,
          ),
        },
      ];
    }),
  ) as ReactorStatus;

  return changed ? nextStatus : status;
};

export const isResourceActiveInStatus = (status: ReactorStatus | undefined, resourceName: string): boolean => {
  if (!status) {
    return false;
  }

  return Object.values(status).some((nodeStatus) =>
    nodeStatus.promoter?.some((promoter) => promoter.drbd_resource === resourceName && promoter.status === 'active'),
  );
};
