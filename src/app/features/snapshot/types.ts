// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components, operations } from '@app/apis/schema';

export type CreateSnapshotRequestBody = components['schemas']['Snapshot'];
export type ResourceListQuery = operations['viewResources']['parameters']['query'];
export type SnapshotListQuery = operations['viewSnapshots']['parameters']['query'];
export type SnapshotType = components['schemas']['Snapshot'];
export type RestoreSnapshotRequestBody = components['schemas']['SnapshotRestore'];

