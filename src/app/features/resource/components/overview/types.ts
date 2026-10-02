// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { TableProps } from 'antd';
import type { ResourceDefinition, VolumeDefinition } from '@app/features/resourceDefinition';
import type { ResourceDataType, VolumeType } from '../../types';

/** One row of a definition's volume sub-table: a deployed volume joined with its resource and definition. */
export type OverviewVolume = VolumeType & {
  size_kib: number;
  node_name?: string;
  resource_name?: string;
  /** The node the resource is Primary (in use) on, or '' when it is nowhere. */
  primary_node: string;
  resource_group_name: string;
  flags?: string[];
  volume_definition?: VolumeDefinition;
  resource: ResourceDataType;
  resourceDefinition: ResourceDefinition;
};

/** A resource definition with its deployed volumes, as the overview table lists it. */
export type OverviewRow = ResourceDefinition & {
  volumes: OverviewVolume[];
  volumeDefinitions: VolumeDefinition[];
};

export type SubTableColumns = NonNullable<TableProps<OverviewVolume>['columns']>;
