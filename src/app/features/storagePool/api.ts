import { del, get, post, put } from '../requests';
import {
  DeleteStoragePoolRequest,
  CreateStoragePoolRequestBody,
  CreatePhysicalStorageRequestBody,
  GetStoragePoolQuery,
  UpdateStoragePoolRequestBody,
  UpdateStoragePoolRequest,
  GetStoragePoolRequestQuery,
} from './types';

const updateStoragePool = ({ node, storagepool }: UpdateStoragePoolRequest, body: UpdateStoragePoolRequestBody) => {
  return put('/v1/nodes/{node}/storage-pools/{storagepool}', {
    params: {
      path: {
        node,
        storagepool,
      },
    },
    body,
  });
};

const deleteStoragePoolV2 = ({ node, storagepool }: DeleteStoragePoolRequest) => {
  return del('/v1/nodes/{node}/storage-pools/{storagepool}', {
    params: {
      path: {
        node,
        storagepool,
      },
    },
  });
};

const getPhysicalStoragePoolByNode = ({ node }: { node: string }) =>
  get('/v1/physical-storage/{node}', {
    params: {
      path: {
        node,
      },
    },
  });

const createPhysicalStorage = (node: string, body: CreatePhysicalStorageRequestBody) => {
  return post('/v1/physical-storage/{node}', {
    params: {
      path: {
        node,
      },
    },
    body,
  });
};

const createStoragePool = (node: string, body: CreateStoragePoolRequestBody) => {
  return post('/v1/nodes/{node}/storage-pools', {
    params: {
      path: {
        node,
      },
    },
    body,
  });
};

const getStoragePoolByNode = (node: string, query?: GetStoragePoolRequestQuery) => {
  return get('/v1/nodes/{node}/storage-pools', {
    params: {
      path: {
        node,
      },
      query,
    },
  });
};

const getStoragePool = (query?: GetStoragePoolQuery) =>
  get('/v1/view/storage-pools', {
    params: {
      query,
    },
  });

const getStoragePoolCount = () => {
  return get('/v1/stats/storage-pools');
};

export {
  deleteStoragePoolV2,
  createPhysicalStorage,
  getPhysicalStoragePoolByNode,
  createStoragePool,
  getStoragePool,
  updateStoragePool,
  getStoragePoolByNode,
  getStoragePoolCount,
};
