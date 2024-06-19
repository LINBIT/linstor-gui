import { del, get, post, put } from '../requests';

import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  ResourceDefinitionListQuery,
  UpdateResourceDefinitionRequestBody,
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

const deleteVolumeDefinition = (resource: string, volume: number) => {
  return del(`/v1/resource-definitions/{resource}/volume-definitions/{volume_number}`, {
    params: {
      path: {
        resource,
        volume_number: volume,
      },
    },
  });
};

const updateResourceDefinition = (resource: string, body: UpdateResourceDefinitionRequestBody) => {
  return put(`/v1/resource-definitions/{resource}`, {
    params: {
      path: {
        resource,
      },
    },
    body,
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
  updateResourceDefinition,
  deleteVolumeDefinition,
};
