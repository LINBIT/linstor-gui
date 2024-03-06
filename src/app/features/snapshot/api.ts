import { post, get } from '../requests';
import { CreateSnapshotRequestBody, ResourceListQuery } from './types';

const getAllResources = (query?: ResourceListQuery) => {
  return get('/v1/view/resources', {
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

export { createSnapshot, getAllResources };
