// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { post, get, del } from '../requests';
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

const deleteSnapshot = (resource: string, snapshot: string) => {
  return del('/v1/resource-definitions/{resource}/snapshots/{snapshot}', {
    params: {
      path: {
        resource,
        snapshot,
      },
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

export { createSnapshot, getAllResources, getSnapshots, deleteSnapshot };
