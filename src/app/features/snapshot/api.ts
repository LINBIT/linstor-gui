import { post, get } from '../requests';
import { CreateSnapshotRequestBody, ResourceListQuery, SnapshotListQuery } from './types';

const getAllResources = (query?: ResourceListQuery) => {
  return get('/v1/view/resources', {
    params: {
      query,
    },
  });
};

const getSnapshots = (query?: SnapshotListQuery) => {
  return get('/v1/view/snapshots', {
    params: {
      query,
    },
  });
};

const createSnapshot = (resource: string, body: CreateSnapshotRequestBody) => {
  return post('/v1/resource-definitions/{resource}/snapshots', {
    params: {
      path: {
        resource,
      },
    },
    body,
  });
};

export { createSnapshot, getAllResources, getSnapshots };
