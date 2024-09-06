// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { operations, components } from '@app/apis/schema';

export type ResourceGroupQuery = operations['resourceGroupList']['parameters']['query'];
export type ResourceGroupCreateRequestBody = components['schemas']['ResourceGroup'];
export type ResourceGroupModifyRequestBody = components['schemas']['ResourceGroupModify'];
export type AddVolumeRequestBody = components['schemas']['VolumeGroup'];

export type CreateResourceGroupRequestBody = components['schemas']['ResourceGroup'];
export type ResourceGroupListQuery = operations['resourceGroupList']['parameters']['query'];
export type UpdateResourceGroupRequestBody = components['schemas']['ResourceGroupModify'];
export type SpawnRequest = components['schemas']['ResourceGroupSpawn'];
