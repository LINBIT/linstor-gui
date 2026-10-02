// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { ResourceDefinition } from '@app/features/resourceDefinition';
import type { ResourceDataType } from '../../types';
import type { OverviewRow, OverviewVolume } from './types';

// Merge structural data (definitions) with live state (resources view).
export const mergeOverviewRows = (
  resourceDefinitions: ResourceDefinition[] | undefined,
  resourcesView: ResourceDataType[] | undefined,
): OverviewRow[] | undefined => {
  if (!resourceDefinitions) return undefined;
  return resourceDefinitions.map((resource): OverviewRow => {
    const { name, volume_definitions: volumeDefinitions } = resource;

    const resourceWithVolumes: OverviewRow = {
      ...resource,
      volumes: [],
      volumeDefinitions: volumeDefinitions || [],
    };

    resourceWithVolumes.volumes =
      resourcesView
        ?.filter((e) => e.name === name)
        ?.flatMap(
          (e) =>
            e.volumes?.map((v): OverviewVolume => {
              const matchingVolume = volumeDefinitions?.find((vd) => vd.volume_number === v.volume_number);
              return {
                ...v,
                size_kib: matchingVolume?.size_kib || 0,
                node_name: e.node_name,
                resource_name: e.name,
                primary_node: e.state?.in_use ? (e.node_name ?? '') : '',
                resource_group_name: resource.resource_group_name || '',
                flags: e.flags,
                volume_definition: matchingVolume,
                resource: e,
                resourceDefinition: resource,
              };
            }) || [],
        ) ?? [];

    return resourceWithVolumes;
  });
};

/** 'OK' when every DRBD connection of the resource is up, else "<node> <message>" per broken one. */
export const connectionStatus = (resourceItem: ResourceDataType) => {
  let failStr = '';
  const conn = resourceItem?.layer_object?.drbd?.connections || {};
  if (Object.keys(conn).length === 0) {
    return 'OK';
  }
  let count = 0;
  let fail = false;
  for (const nodeName in conn) {
    count++;
    if (!conn?.[nodeName]?.connected) {
      fail = true;
      if (failStr !== '') {
        failStr += ',';
      }
      failStr += `${nodeName} ${conn?.[nodeName]?.message}`;
    }
  }
  fail = count === 0 ? true : fail;
  failStr = fail ? failStr : 'OK';
  return failStr;
};

export const calculatePercentage = (allocated: number = 0, total: number = 0): string => {
  if (total === 0) return '0.00';
  const percentage = (allocated / total) * 100;
  return Math.min(percentage, 100).toFixed(2);
};

/** The Aux/* property names any definition carries. */
export const auxPropKeys = (rows: OverviewRow[] | undefined) =>
  Array.from(new Set(rows?.flatMap((item) => Object.keys(item.props ?? {}).filter((key) => key.startsWith('Aux')))));

export const resourceKey = (vol: OverviewVolume) => `${vol.resource_name ?? ''}@${vol.node_name ?? ''}`;
