import 'whatwg-fetch';

import { Fetcher } from 'openapi-typescript-fetch';

import { paths } from '../apis/schema';

// declare fetcher for paths
const fetcher = Fetcher.for<paths>();

// global configuration
fetcher.configure({});

// create fetch operations
const getNodeStats = fetcher.path('/v1/stats/nodes').method('get').create();
const getNodes = fetcher.path('/v1/nodes').method('get').create();
const addNode = fetcher.path('/v1/nodes').method('post').create();
const deleteNode = fetcher.path('/v1/nodes/{node}').method('delete');
const updateNode = fetcher.path('/v1/nodes/{node}').method('put');
const lostNode = fetcher.path('/v1/nodes/{node}/lost').method('delete');

// storage pool
const getPhysicalStoragePoolByNode = fetcher.path('/v1/physical-storage/{node}').method('get').create();
const createPhysicalStoragePool = fetcher.path('/v1/physical-storage/{node}').method('post').create();
const deleteStoragePool = fetcher.path('/v1/nodes/{node}/storage-pools/{storagepool}').method('delete');

export {
  getNodeStats,
  getNodes,
  addNode,
  deleteNode,
  updateNode,
  lostNode,
  getPhysicalStoragePoolByNode,
  createPhysicalStoragePool,
};
