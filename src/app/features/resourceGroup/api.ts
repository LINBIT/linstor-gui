// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { del, get, post, put } from '@app/features/requests';

import {
  ResourceGroupQuery,
  ResourceGroupCreateRequestBody,
  ResourceGroupModifyRequestBody,
  AddVolumeRequestBody,
  SpawnRequest,
} from './types';

const getResourceGroups = (query: ResourceGroupQuery) => {
  return get('/v1/resource-groups', {
    params: {
      query,
    },
  });
};

const getResourceGroupCount = () => {
  return get('/v1/stats/resource-groups');
};

const createResourceGroup = (body: ResourceGroupCreateRequestBody) => {
  return post('/v1/resource-groups', {
    body,
  });
};

const deleteResourceGroup = (resource_group: string) => {
  return del('/v1/resource-groups/{resource_group}', {
    params: {
      path: { resource_group },
    },
  });
};

const updateResourceGroup = (resource_group: string, body: ResourceGroupModifyRequestBody) => {
  return put('/v1/resource-groups/{resource_group}', {
    params: {
      path: {
        resource_group,
      },
    },
    body,
  });
};

const spawnResourceGroup = (resource_group: string, body: SpawnRequest) => {
  return post('/v1/resource-groups/{resource_group}/spawn', {
    params: {
      path: {
        resource_group,
      },
    },
    body,
  });
};

const addVolumeToResourceGroup = (resource_group: string, body: AddVolumeRequestBody) => {
  return post('/v1/resource-groups/{resource_group}/volume-groups', {
    params: {
      path: {
        resource_group,
      },
    },
    body,
  });
};

export {
  getResourceGroups,
  createResourceGroup,
  updateResourceGroup,
  addVolumeToResourceGroup,
  getResourceGroupCount,
  deleteResourceGroup,
  spawnResourceGroup,
};
