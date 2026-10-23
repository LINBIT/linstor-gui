// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { get, put, post, del, unwrap } from '../requests';
import { logger } from '@app/utils/logger';
import type { components } from '@app/apis/schema';
import type { ExternalFile } from '@app/features/files/types';

const getHAResourceDefinitions = () => {
  return get('/v1/resource-definitions', {
    params: {
      query: {
        with_volume_definitions: true,
      },
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
    // The schema marks alt_suffixes required; LINSTOR treats a missing list as none.
    body: {
      path: filePath,
      content,
      ...(isReactorConfig && { alt_suffixes: ['.disabled'] }),
    } as ExternalFile,
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
            resources: [resourceName],
          },
        }
      : undefined,
  });
};

// The controller's response shape for /v1/nodes/exec/drbd-reactorctl/*.
// Generated from the OpenAPI spec rather than hand-written, so it tracks the
// controller instead of drifting from it.
type ExecResponse = components['schemas']['ReactorExecResponse'];

// drbd-reactorctl's own --json output, carried inside ExecResponse.stdout_utf8.
// Not a LINSTOR API type, so it stays hand-written.
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

// A node that gave no status, and why.
interface DrbdReactorFailure {
  node: string;
  // The satellite could not start drbd-reactorctl at all: drbd-reactor is not installed there.
  notInstalled: boolean;
  message: string;
}

interface DrbdReactorReport {
  status: Record<string, DrbdReactorStatus>;
  failures: DrbdReactorFailure[];
}

// What the satellite reports when the program is missing, e.g.
// `Cannot run program "drbd-reactorctl": Exec failed, error: 2 (No such file or directory)`.
const NOT_INSTALLED = /Cannot run program "drbd-reactorctl".*No such file or directory/;

// Get DRBD Reactor status from nodes, with the reason for each node that gave none.
const getDrbdReactorStatus = async (nodes: string[]): Promise<DrbdReactorReport> => {
  const results: ExecResponse[] = await unwrap(
    post('/v1/nodes/exec/drbd-reactorctl/status', { body: { nodes, wait: false } }),
  );
  const report: DrbdReactorReport = { status: {}, failures: [] };

  for (const result of results) {
    if (result.exit_code === 0 && result.stdout_utf8) {
      try {
        report.status[result.node] = JSON.parse(result.stdout_utf8) as DrbdReactorStatus;
      } catch (e) {
        logger.error(`Failed to parse status for node ${result.node}:`, e);
      }
    } else if (result.exit_code !== 0) {
      const message = (result.stderr_utf8 || result.stdout_utf8 || '').trim();
      report.failures.push({ node: result.node, notInstalled: NOT_INSTALLED.test(message), message });
    }
  }

  return report;
};

// Evict DRBD Reactor resource on nodes
const evictDrbdReactor = (nodes: string[], resource?: string, wait = false): Promise<ExecResponse[]> =>
  unwrap(post('/v1/nodes/exec/drbd-reactorctl/evict', { body: { nodes, resource, wait } }));

// Disable DRBD Reactor plugin on nodes
const disableDrbdReactor = (nodes: string[], config: string, now = false): Promise<ExecResponse[]> =>
  unwrap(post('/v1/nodes/exec/drbd-reactorctl/disable', { body: { nodes, config, now } }));

// Enable DRBD Reactor plugin on nodes
const enableDrbdReactor = (nodes: string[], config: string): Promise<ExecResponse[]> =>
  unwrap(post('/v1/nodes/exec/drbd-reactorctl/enable', { body: { nodes, config, now: false } }));

// Restart DRBD Reactor plugin on nodes
const restartDrbdReactor = (nodes: string[], config: string): Promise<ExecResponse[]> =>
  unwrap(post('/v1/nodes/exec/drbd-reactorctl/restart', { body: { nodes, config, now: false } }));

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

export type { ExecResponse, DrbdReactorStatus, DrbdReactorFailure, DrbdReactorReport };
