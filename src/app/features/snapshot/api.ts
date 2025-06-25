// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { post, get, del } from '../requests';
import { CreateSnapshotRequestBody, ResourceListQuery, RestoreSnapshotRequestBody, SnapshotListQuery } from './types';

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

const restoreSnapshot = (resource: string, snapshot: string, body: RestoreSnapshotRequestBody) => {
  return post('/v1/resource-definitions/{resource}/snapshot-restore-resource/{snapshot}', {
    params: {
      path: {
        resource,
        snapshot,
      },
    },
    body,
  });
};

const restoreVolumeDefinition = (resource: string, snapshot: string, body: RestoreSnapshotRequestBody) => {
  return post('/v1/resource-definitions/{resource}/snapshot-restore-volume-definition/{snapshot}', {
    params: {
      path: {
        resource,
        snapshot,
      },
    },
    body,
  });
};

const rollbackSnapshot = (resource: string, snapshot: string) => {
  return post('/v1/resource-definitions/{resource}/snapshot-rollback/{snapshot}', {
    params: {
      path: {
        resource,
        snapshot,
      },
    },
  });
};

export {
  createSnapshot,
  getAllResources,
  getSnapshots,
  deleteSnapshot,
  restoreSnapshot,
  rollbackSnapshot,
  restoreVolumeDefinition,
};
