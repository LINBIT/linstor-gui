// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { del, get, post, put } from '@app/features/requests';

import { ExternalFile } from './types';

// URL-encode the path for the API
const encodeFileName = (path: string): string => {
  return encodeURIComponent(path);
};

const getFiles = (includeContent = false) => {
  return get('/v1/files', {
    params: {
      query: {
        content: includeContent,
      },
    },
  });
};

const getFile = (extFileName: string) => {
  return get('/v1/files/{extFileName}', {
    params: {
      path: {
        extFileName: encodeFileName(extFileName),
      },
    },
  });
};

const createOrUpdateFile = (extFileName: string, body: ExternalFile) => {
  return put('/v1/files/{extFileName}', {
    params: {
      path: {
        extFileName: encodeFileName(extFileName),
      },
    },
    body,
  });
};

const deleteFile = (extFileName: string) => {
  return del('/v1/files/{extFileName}', {
    params: {
      path: {
        extFileName: encodeFileName(extFileName),
      },
    },
  });
};

// Deploy an external file to a resource definition
const deployFile = (resource: string, extFileName: string) => {
  return post('/v1/resource-definitions/{resource}/files/{extFileName}', {
    params: {
      path: {
        resource,
        extFileName: encodeFileName(extFileName),
      },
    },
  });
};

// Undeploy an external file from a resource definition
const undeployFile = (resource: string, extFileName: string) => {
  return del('/v1/resource-definitions/{resource}/files/{extFileName}', {
    params: {
      path: {
        resource,
        extFileName: encodeFileName(extFileName),
      },
    },
  });
};

export { getFiles, getFile, createOrUpdateFile, deleteFile, deployFile, undeployFile };
