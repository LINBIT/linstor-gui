import { get, post, put } from '../requests';
import {
  CreateResourceDefinitionRequestBody,
  CreateVolumeDefinitionRequestBody,
  AutoPlaceRequestBody,
  ResourceModifyRequestBody,
  ResourceCreateRequestBody,
  GetResourcesRequestBody,
  GetResourcesResponseBody,
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

const resourceCreateOnNode = async (resource_name: string, node: string, body: ResourceCreateRequestBody) => {
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

const resourceModify = async (resource_name: string, node: string, body: ResourceModifyRequestBody) => {
  return put('/v1/resource-definitions/{resource}/resources/{node}', {
    params: {
      path: {
        resource: resource_name,
        node,
      },
    },
    body,
  });
};

const resourceMigration = async (data: { resource: string; node: string; fromnode: string }) => {
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

export {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  resourceModify,
  resourceCreateOnNode,
  resourceMigration,
};
