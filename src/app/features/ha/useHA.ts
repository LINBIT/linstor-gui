// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
} from './api';
import type { DrbdReactorStatus, ExecResponse } from './api';

export interface HAResourceDefinition {
  name: string;
  uuid: string;
  props?: Record<string, string>;
  layer_data?: Array<{
    type: string;
    data?: Record<string, unknown>;
  }>;
  resource_group_name?: string;
  volume_definitions?: Array<{
    volume_number: number;
    size_kib: number;
    props?: Record<string, string>;
    uuid: string;
    layer_data?: Array<{
      type: string;
      data?: Record<string, unknown>;
    }>;
  }>;
}

const HA_PROP_KEY = 'files/etc/drbd-reactor.d/';

export const useHA = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ha-resource-definitions'],
    queryFn: getHAResourceDefinitions,
  });

  const haResources: HAResourceDefinition[] = React.useMemo(() => {
    if (!data?.data) {
      return [];
    }
    return (data.data as HAResourceDefinition[]).filter((rd) => {
      if (!rd.props) return false;
      return Object.keys(rd.props).some((key) => key.startsWith(HA_PROP_KEY));
    });
  }, [data]);

  return {
    data: haResources,
    isLoading,
    error,
    refetch,
  };
};

export const useLinstorFiles = () => {
  return useQuery({
    queryKey: ['linstor-files'],
    queryFn: listFiles,
  });
};

export const useAllResourceDefinitions = () => {
  return useQuery({
    queryKey: ['ha-all-resource-definitions'],
    queryFn: getHAResourceDefinitions,
  });
};

export const useResources = (resourceName?: string) => {
  return useQuery({
    queryKey: ['resources-view', resourceName],
    queryFn: () => getResources(resourceName),
    enabled: !!resourceName,
  });
};

export const hasHAConfig = (props?: Record<string, string>): boolean => {
  if (!props) return false;
  return Object.keys(props).some((key) => key.startsWith(HA_PROP_KEY));
};

export const useFileContent = (filePath: string) => {
  // Strip 'files/' prefix, ensure leading '/', and URL encode
  const apiPath = filePath.replace(/^files\//, '');
  // Ensure path starts with / for absolute path, then encode
  const pathWithSlash = apiPath.startsWith('/') ? apiPath : '/' + apiPath;

  return useQuery({
    queryKey: ['file-content', filePath],
    queryFn: () => getFileContent(pathWithSlash),
    enabled: !!filePath,
  });
};

export const useCreateFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filePath, content }: { filePath: string; content: string }) => createFile(filePath, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['ha-all-resource-definitions'] });
    },
  });
};

export const useDeployFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceName, filePath }: { resourceName: string; filePath: string }) =>
      deployFile(resourceName, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
    },
  });
};

// Hook for getting DRBD Reactor status from all nodes.
// By default this fetches once; callers can enable interval polling for short-lived workflows
// such as tracking an in-progress evict.
export const useDrbdReactorStatus = (nodes: string[], enabled = true, refetchInterval: number | false = false) => {
  return useQuery({
    queryKey: ['drbd-reactor-status', nodes],
    queryFn: () => getDrbdReactorStatus(nodes),
    enabled: enabled && nodes.length > 0,
    retry: 1, // One retry is enough; the controller is either up or failing over
    refetchInterval,
  });
};

// Hook for evicting DRBD Reactor resource
export const useEvictDrbdReactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodes, resource, wait = false }: { nodes: string[]; resource: string; wait?: boolean }) =>
      evictDrbdReactor(nodes, resource, wait),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    },
  });
};

// Hook for disabling DRBD Reactor plugin
export const useDisableDrbdReactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodes, config, now = false }: { nodes: string[]; config: string; now?: boolean }) =>
      disableDrbdReactor(nodes, config, now),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    },
  });
};

// Hook for enabling DRBD Reactor plugin
export const useEnableDrbdReactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodes, config }: { nodes: string[]; config: string }) => enableDrbdReactor(nodes, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    },
  });
};

// Hook for restarting DRBD Reactor plugin
export const useRestartDrbdReactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodes, config }: { nodes: string[]; config: string }) => restartDrbdReactor(nodes, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    },
  });
};

// Hook for unmanaging HA config (undeploy from resource definition, keep file in LINSTOR and on disk)
export const useUnmanageHA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceName, filePath }: { resourceName: string; filePath: string }) =>
      undeployFile(resourceName, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['ha-all-resource-definitions'] });
    },
  });
};

// Hook for managing HA config (deploy file to resource definition)
export const useManageHA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceName, filePath }: { resourceName: string; filePath: string }) =>
      deployFile(resourceName, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['ha-all-resource-definitions'] });
    },
  });
};

// Hook for deleting HA file
export const useDeleteHA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceName, filePath }: { resourceName: string; filePath: string }) =>
      undeployFile(resourceName, filePath).then(() => deleteFile(filePath)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['ha-all-resource-definitions'] });
    },
  });
};

export type { DrbdReactorStatus, ExecResponse };
