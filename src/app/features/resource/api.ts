import { del, get, post, put } from '../requests';
import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  ResourceModifyRequestBody,
  ResourceCreateRequestBody,
  ResourceListQuery,
} from './types';

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

const resourceCreateOnNode = (resource_name: string, node: string, body: ResourceCreateRequestBody) => {
  return post('/v1/resource-definitions/{resource}/resources/{node}', {
    params: {
      path: {
        resource: resource_name,
        node,
      },
    },
    body,
  });
};

const deleteResource = (resource: string, node: string) => {
  return del('/v1/resource-definitions/{resource}/resources/{node}', {
    params: {
      path: {
        resource,
        node,
      },
    },
  });
};

const resourceModify = (resource: string, node: string, body: ResourceModifyRequestBody) => {
  return put('/v1/resource-definitions/{resource}/resources/{node}', {
    params: {
      path: {
        resource,
        node,
      },
    },
    body,
  });
};

const resourceMigration = (data: { resource: string; node: string; fromnode: string }) => {
  const { resource, node, fromnode } = data;
  return put('/v1/resource-definitions/{resource}/resources/{node}/migrate-disk/{fromnode}', {
    params: {
      path: {
        resource,
        node,
        fromnode,
      },
    },
  });
};

const getResourceCount = () => {
  return get('/v1/stats/resources');
};

const getResources = (query?: ResourceListQuery) => {
  return get('/v1/view/resources', {
    params: {
      query,
    },
  });
};

export {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  resourceModify,
  resourceCreateOnNode,
  resourceMigration,
  getResources,
  getResourceCount,
  deleteResource,
};
