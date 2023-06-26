import { get, post } from '../requests';

import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  ResourceDefinitionListQuery,
} from './types';

const createResourceDefinition = async (body: CreateResourceDefinitionRequestBody) => {
  return post('/v1/resource-definitions', {
    body,
  });
};

const createVolumeDefinition = async (resource: string, body: CreateVolumeDefinitionRequestBody) => {
  return post('/v1/resource-definitions/{resource}/volume-definitions', {
    params: {
      path: {
        resource,
      },
    },
    body,
  });
};

const autoPlace = async (resource: string, body: AutoPlaceRequestBody) => {
  return post('/v1/resource-definitions/{resource}/autoplace', {
    params: {
      path: {
        resource,
      },
    },
    body,
  });
};

const getResourceDefinition = async (query: ResourceDefinitionListQuery) => {
  return get('/v1/resource-definitions', {
    params: {
      query,
    },
  });
};

export { createResourceDefinition, createVolumeDefinition, autoPlace, getResourceDefinition };
