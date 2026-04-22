// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { get, put, post, del } from '../requests';

const getHAResourceDefinitions = () => {
  return get('/v1/resource-definitions', {
    params: {
      query: {
        with_volume_definitions: true,
      } as any,
    },
  });
};

const listFiles = () => {
  return get('/v1/files');
};

const getFileContent = (filePath: string) => {
  return get('/v1/files/{extFileName}', {
    params: {
      path: {
        extFileName: encodeURIComponent(filePath),
      },
    },
  });
};

const createFile = (filePath: string, content: string) => {
  const isReactorConfig = filePath.startsWith('/etc/drbd-reactor.d/') && filePath.endsWith('.toml');

  return put('/v1/files/{extFileName}', {
    params: {
      path: {
        extFileName: encodeURIComponent(filePath),
      },
    },
    body: {
      path: filePath,
      content,
      ...(isReactorConfig && { alt_suffixes: ['.disabled'] }),
    },
  });
};

const deployFile = (resourceName: string, filePath: string) => {
  return post('/v1/resource-definitions/{resource}/files/{extFileName}', {
    params: {
      path: {
        resource: resourceName,
        extFileName: encodeURIComponent(filePath),
      },
    },
  });
};

const getResources = (resourceName?: string) => {
  return get('/v1/view/resources', {
    params: resourceName
      ? {
          query: {
            resources: resourceName,
          } as any,
        }
      : undefined,
  });
};

// drbd-reactorctl API types
interface ExecResponse {
  node: string;
  exit_code: number;
  stdout_utf8?: string;
  stderr_utf8?: string;
  active_node?: string | null;
}

interface DrbdReactorStatus {
  promoter?: Array<{
    drbd_resource: string;
    path: string;
    primary_on: string;
    target?: {
      name: string;
      status: string;
      freezer: string;
    };
    dependencies?: Array<{
      name: string;
      status: string;
      freezer: string;
    }>;
    status: string;
  }>;
  prometheus?: Array<{
    path: string;
    address: string;
    status: string;
  }>;
}

const getLinstorBaseUrl = (): string =>
  typeof window !== 'undefined' ? localStorage.getItem('LINSTOR_HOST') || '' : '';

const execPost = async (path: string, body: unknown): Promise<unknown> => {
  const url = `${getLinstorBaseUrl()}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Get DRBD Reactor status from nodes
const getDrbdReactorStatus = async (nodes: string[]): Promise<Record<string, DrbdReactorStatus>> => {
  const results = (await execPost('/v1/nodes/exec/drbd-reactorctl/status', { nodes })) as ExecResponse[];
  const statusMap: Record<string, DrbdReactorStatus> = {};

  for (const result of results) {
    if (result.exit_code === 0 && result.stdout_utf8) {
      try {
        statusMap[result.node] = JSON.parse(result.stdout_utf8) as DrbdReactorStatus;
      } catch (e) {
        console.error(`Failed to parse status for node ${result.node}:`, e);
      }
    }
  }

  return statusMap;
};

// Evict DRBD Reactor resource on nodes
const evictDrbdReactor = async (nodes: string[], resource?: string, wait = false): Promise<ExecResponse[]> => {
  return execPost('/v1/nodes/exec/drbd-reactorctl/evict', { nodes, resource, wait }) as Promise<ExecResponse[]>;
};

// Disable DRBD Reactor plugin on nodes
const disableDrbdReactor = async (nodes: string[], config: string, now = false): Promise<ExecResponse[]> => {
  return execPost('/v1/nodes/exec/drbd-reactorctl/disable', { nodes, config, now }) as Promise<ExecResponse[]>;
};

// Enable DRBD Reactor plugin on nodes
const enableDrbdReactor = async (nodes: string[], config: string): Promise<ExecResponse[]> => {
  return execPost('/v1/nodes/exec/drbd-reactorctl/enable', { nodes, config }) as Promise<ExecResponse[]>;
};

// Restart DRBD Reactor plugin on nodes
const restartDrbdReactor = async (nodes: string[], config: string): Promise<ExecResponse[]> => {
  return execPost('/v1/nodes/exec/drbd-reactorctl/restart', { nodes, config }) as Promise<ExecResponse[]>;
};

// Delete external file from LINSTOR
const deleteFile = (filePath: string) => {
  return del('/v1/files/{extFileName}', {
    params: {
      path: {
        extFileName: encodeURIComponent(filePath),
      },
    },
  });
};

// Undeploy file from resource definition
const undeployFile = (resourceName: string, filePath: string) => {
  return del('/v1/resource-definitions/{resource}/files/{extFileName}', {
    params: {
      path: {
        resource: resourceName,
        extFileName: encodeURIComponent(filePath),
      },
    },
  });
};

export {
  getHAResourceDefinitions,
  listFiles,
  getFileContent,
  createFile,
  deployFile,
  getResources,
  getDrbdReactorStatus,
  evictDrbdReactor,
  disableDrbdReactor,
  enableDrbdReactor,
  restartDrbdReactor,
  deleteFile,
  undeployFile,
};

export type { ExecResponse, DrbdReactorStatus };
