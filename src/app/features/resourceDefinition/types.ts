// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components, operations } from '@app/apis/schema';

export type CreateResourceDefinitionRequestBody = components['schemas']['ResourceDefinitionCreate'];
export type CreateVolumeDefinitionRequestBody = components['schemas']['VolumeDefinitionCreate'];
export type AutoPlaceRequestBody = components['schemas']['AutoPlaceRequest'];
export type ResourceDefinitionListQuery = operations['resourceDefinitionList']['parameters']['query'];
export type ResourceDefinition = components['schemas']['ResourceDefinition'];
export type VolumeDefinition = components['schemas']['VolumeDefinition'];
export type UpdateResourceDefinitionRequestBody = components['schemas']['ResourceDefinitionModify'];
export type ResourceDefinitionCloneRequest = components['schemas']['ResourceDefinitionCloneRequest'];
export type VolumeDefinitionModify = components['schemas']['VolumeDefinitionModify'];
export type VolumeDefinitionModifyRequestBody = components['schemas']['VolumeDefinitionModify'];
