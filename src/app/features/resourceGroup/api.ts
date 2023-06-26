import { get, post, put } from '@app/features/requests';

import {
  ResourceGroupQuery,
  ResourceGroupCreateRequestBody,
  ResourceGroupModifyRequestBody,
  AddVolumeRequestBody,
} from './types';

const getResourceGroups = async (query: ResourceGroupQuery) => {
  return get('/v1/resource-groups', {
    params: {
      query,
    },
  });
};

const createResourceGroup = async (body: ResourceGroupCreateRequestBody) => {
  return post('/v1/resource-groups', {
    body,
  });
};

const updateResourceGroup = async (resource_group: string, body: ResourceGroupModifyRequestBody) => {
  return put('/v1/resource-groups/{resource_group}', {
    params: {
      path: {
        resource_group,
      },
    },
    body,
  });
};

const addVolumeToResourceGroup = async (resource_group: string, body: AddVolumeRequestBody) => {
  return post('/v1/resource-groups/{resource_group}/volume-groups', {
    params: {
      path: {
        resource_group,
      },
    },
    body,
  });
};

export { getResourceGroups, createResourceGroup, updateResourceGroup, addVolumeToResourceGroup };
