import { del, get, post } from '../requests';

import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  ResourceDefinitionListQuery,
} from './types';

const getResourceDefinitionCount = () => {
  return get('/v1/stats/resource-definitions');
};

const createResourceDefinition = (body: CreateResourceDefinitionRequestBody) => {
  return post('/v1/resource-definitions', {
    body,
  });
};

const createVolumeDefinition = (resource: string, body: CreateVolumeDefinitionRequestBody) => {
  return post('/v1/resource-definitions/{resource}/volume-definitions', {
    params: {
      path: {
        resource,
      },
    },
    body,
  });
};

const autoPlace = (resource: string, body: AutoPlaceRequestBody) => {
  return post('/v1/resource-definitions/{resource}/autoplace', {
    params: {
      path: {
        resource,
      },
    },
    body,
  });
};

const getResourceDefinition = (query: ResourceDefinitionListQuery) => {
  return get('/v1/resource-definitions', {
    params: {
      query,
    },
  });
};

const deleteResourceDefinition = (resource: string) => {
  return del(`/v1/resource-definitions/{resource}`, {
    params: {
      path: {
        resource,
      },
    },
  });
};

const getVolumeDefinitionListByResource = (resource: string) => {
  return get(`/v1/resource-definitions/{resource}/volume-definitions`, {
    params: {
      path: {
        resource,
      },
    },
  });
};

export {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  getVolumeDefinitionListByResource,
};
