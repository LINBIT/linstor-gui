// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

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

const getResourcesByResourceName = (resource: string) => {
  return get('/v1/resource-definitions/{resource}/resources', {
    params: {
      path: {
        resource,
      },
    },
  });
};

const adjustResourceGroup = ({ resource_group }: { resource_group: string }) => {
  return post('/v1/resource-groups/{resource_group}/adjust', {
    params: {
      path: {
        resource_group,
      },
    },
  });
};

const toggleResource = (resource: string, node: string, action: 'to_diskless' | 'to_diskful') => {
  if (action === 'to_diskful') {
    return put('/v1/resource-definitions/{resource}/resources/{node}/toggle-disk/diskful', {
      params: {
        path: {
          resource,
          node,
        },
      },
    });
  }

  return put('/v1/resource-definitions/{resource}/resources/{node}/toggle-disk/diskless', {
    params: {
      path: {
        resource,
        node,
      },
    },
  });
};

const createResourceOnNode = (resource: string, node: string, drbdDiskless: boolean = false, storagePool?: string) => {
  const resourceData: ResourceCreateRequestBody = {
    resource: {
      name: resource,
      node_name: node,
    },
  };

  if (drbdDiskless) {
    resourceData.resource.flags = ['DRBD_DISKLESS'];
  } else if (storagePool) {
    resourceData.resource.props = {
      StorPoolName: storagePool,
    };
  }

  return resourceCreateOnNode(resource, node, resourceData);
};

const makeResourceAvailable = (resource: string, node: string, diskful: boolean) => {
  return post('/v1/resource-definitions/{resource}/resources/{node}/make-available', {
    params: {
      path: {
        resource,
        node,
      },
    },
    body: {
      diskful,
    },
  });
};

export {
  createResourceDefinition,
  createVolumeDefinition,
  autoPlace,
  resourceModify,
  resourceCreateOnNode,
  createResourceOnNode,
  resourceMigration,
  getResources,
  getResourceCount,
  deleteResource,
  getResourcesByResourceName,
  adjustResourceGroup,
  toggleResource,
  makeResourceAvailable,
};
