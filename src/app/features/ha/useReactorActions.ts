// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useNodes } from '@app/features/node/hooks/useNode';
import { useDrbdReactorStatus, useEvictDrbdReactor, useDisableDrbdReactor, useEnableDrbdReactor } from './useHA';
import { getEvictOutcome } from './evict';
import {
  type HARecord,
  type ReactorStatus,
  activeNodeInStatus,
  decodeExecText,
  getConfigName,
  isResourceActiveInStatus,
  resourceNodesInStatus,
  syncEvictedResourceInStatus,
} from './haStatus';

/**
 * The cluster's DRBD Reactor status and the actions that change it: evict,
 * stop and start. Each action ends once the polled status shows its result.
 */
export const useReactorActions = () => {
  const queryClient = useQueryClient();

  // Get all nodes for reactor status query
  const { data: nodesData } = useNodes();
  const nodeNames = useMemo(() => {
    if (!nodesData) return [];
    return nodesData.map((n) => n.name);
  }, [nodesData]);

  // When non-null, an evict is in flight: track which resource and which node it was evicted from.
  const [evictingResource, setEvictingResource] = useState<{ resourceName: string; fromNode: string } | null>(null);
  const [evictStartedAt, setEvictStartedAt] = useState<number | null>(null);
  const [stoppingResource, setStoppingResource] = useState<string | null>(null);
  const [stopStartedAt, setStopStartedAt] = useState<number | null>(null);

  // Fetch reactor status once for the page, then temporarily switch to polling while an evict is in flight.
  const {
    data: reactorStatus,
    isLoading: reactorStatusLoading,
    dataUpdatedAt: reactorStatusUpdatedAt,
    refetch: refetchReactorStatus,
  } = useDrbdReactorStatus(nodeNames, nodeNames.length > 0, evictingResource || stoppingResource ? 5000 : false);

  // Evict mutation
  const evictMutation = useEvictDrbdReactor();

  // Disable/Enable mutations
  const disableMutation = useDisableDrbdReactor();
  const enableMutation = useEnableDrbdReactor();

  // Detect evict completion once the source node no longer reports the resource as active.
  useEffect(() => {
    if (!evictingResource || !reactorStatus) return;
    if (evictStartedAt !== null && reactorStatusUpdatedAt <= evictStartedAt) return;

    const { resourceName } = evictingResource;
    const outcome = getEvictOutcome(reactorStatus, evictingResource);
    if (outcome.status === 'waiting') return;

    message.destroy('evict-in-progress');
    message.success(
      outcome.status === 'migrated'
        ? `"${resourceName}" migrated to ${outcome.newNode}`
        : `"${resourceName}" evicted successfully`,
    );
    setEvictingResource(null);
    setEvictStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, evictStartedAt, evictingResource]);

  useEffect(() => {
    if (!stoppingResource || !reactorStatus) return;
    if (stopStartedAt !== null && reactorStatusUpdatedAt <= stopStartedAt) return;
    if (isResourceActiveInStatus(reactorStatus, stoppingResource)) return;

    message.destroy('stop-in-progress');
    message.success(`"${stoppingResource}" stopped successfully`);
    setStoppingResource(null);
    setStopStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, stopStartedAt, stoppingResource]);

  const [startingResource, setStartingResource] = useState<string | null>(null);
  const [startStartedAt, setStartStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!startingResource || !reactorStatus) return;
    if (startStartedAt !== null && reactorStatusUpdatedAt <= startStartedAt) return;
    if (!isResourceActiveInStatus(reactorStatus, startingResource)) return;

    message.destroy('start-in-progress');
    message.success(`"${startingResource}" started successfully`);
    setStartingResource(null);
    setStartStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, startStartedAt, startingResource]);

  const getPrimaryNode = (resourceName: string): string | null => activeNodeInStatus(reactorStatus, resourceName);

  /**
   * Check if a resource is currently active (running on any node).
   */
  const isResourceActive = (resourceName: string): boolean => {
    return isResourceActiveInStatus(reactorStatus, resourceName);
  };

  /**
   * Handle stop: disable on non-active nodes first, then disable --now on active node.
   */
  const handleStop = async (record: HARecord) => {
    const configName = getConfigName(record);
    if (!configName) {
      message.warning(`Resource "${record.name}" has no DRBD Reactor configuration file — stop is not possible.`);
      return;
    }

    const activeNode = getPrimaryNode(record.name);
    const allNodes = resourceNodesInStatus(reactorStatus, record.name);

    if (allNodes.length === 0) {
      message.warning(`Resource "${record.name}" is not present on any node.`);
      return;
    }

    const nonActiveNodes = allNodes.filter((n) => n !== activeNode);

    message.loading({ content: `Stopping "${record.name}"...`, key: 'stop-in-progress', duration: 0 });

    try {
      // Step 1: Disable on all non-active nodes first
      if (nonActiveNodes.length > 0) {
        await disableMutation.mutateAsync({ nodes: nonActiveNodes, config: configName });
      }

      // Step 2: Disable --now on the active node
      if (activeNode) {
        await disableMutation.mutateAsync({ nodes: [activeNode], config: configName, now: true });
      }

      message.loading({
        content: `Stopping "${record.name}", waiting for DRBD Reactor status…`,
        key: 'stop-in-progress',
        duration: 0,
      });
      const startedAt = Date.now();
      setStopStartedAt(startedAt);
      setStoppingResource(record.name);
      void refetchReactorStatus();
    } catch (err) {
      setStoppingResource(null);
      setStopStartedAt(null);
      message.destroy('stop-in-progress');
      message.error(`Failed to stop "${record.name}": ${err}`);
    }
  };

  /**
   * Handle start: enable on all nodes.
   */
  const handleStart = async (record: HARecord) => {
    const configName = getConfigName(record);
    if (!configName) {
      message.warning(`Resource "${record.name}" has no DRBD Reactor configuration file — start is not possible.`);
      return;
    }

    // When stopped, DRBD Reactor doesn't report the resource, so fall back to all cluster nodes
    const allNodes = resourceNodesInStatus(reactorStatus, record.name);
    const targetNodes = allNodes.length > 0 ? allNodes : nodeNames;

    if (targetNodes.length === 0) {
      message.warning(`No nodes available to start "${record.name}".`);
      return;
    }

    message.loading({ content: `Starting "${record.name}"...`, key: 'start-in-progress', duration: 0 });

    try {
      await enableMutation.mutateAsync({ nodes: targetNodes, config: configName });
      message.loading({
        content: `Starting "${record.name}", waiting for DRBD Reactor status…`,
        key: 'start-in-progress',
        duration: 0,
      });
      const startedAt = Date.now();
      setStartStartedAt(startedAt);
      setStartingResource(record.name);
      void refetchReactorStatus();
    } catch (err) {
      message.destroy('start-in-progress');
      message.error(`Failed to start "${record.name}": ${err}`);
    }
  };

  const handleEvict = (record: HARecord) => {
    const primaryNode = getPrimaryNode(record.name);

    if (!primaryNode) {
      message.warning(`Resource "${record.name}" has no active node — evict is not possible in this state.`);
      return;
    }

    const configName = getConfigName(record);
    if (!configName) {
      message.warning(`Resource "${record.name}" has no DRBD Reactor configuration file — evict is not possible.`);
      return;
    }

    message.loading({
      content: `Evicting "${record.name}" from ${primaryNode}, waiting for completion…`,
      key: 'evict-in-progress',
      duration: 0,
    });

    evictMutation.mutate(
      { nodes: [primaryNode], resource: configName, wait: true },
      {
        onSuccess: (results) => {
          const result = results[0];
          if (result && result.exit_code !== 0) {
            setEvictingResource(null);
            setEvictStartedAt(null);
            message.destroy('evict-in-progress');
            message.error(`Evict failed: ${decodeExecText(result.stderr_utf8) || `exit code ${result.exit_code}`}`);
            return;
          }

          if (result?.active_node) {
            setEvictingResource(null);
            setEvictStartedAt(null);
            queryClient.setQueryData<ReactorStatus | undefined>(['drbd-reactor-status', nodeNames], (currentStatus) =>
              syncEvictedResourceInStatus(currentStatus, record.name, result.active_node as string),
            );
            message.destroy('evict-in-progress');
            message.success(`"${record.name}" migrated to ${result.active_node}`);
            queryClient.invalidateQueries({ queryKey: ['drbd-reactor-status'] });
            queryClient.invalidateQueries({ queryKey: ['resources-view'] });
            queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
            return;
          }

          message.loading({
            content: `Evicting "${record.name}" from ${primaryNode}, waiting for DRBD Reactor status…`,
            key: 'evict-in-progress',
            duration: 0,
          });
          const startedAt = Date.now();
          setEvictStartedAt(startedAt);
          setEvictingResource({ resourceName: record.name, fromNode: primaryNode });
          void refetchReactorStatus();
        },
        onError: (err) => {
          setEvictingResource(null);
          setEvictStartedAt(null);
          message.destroy('evict-in-progress');
          message.error(`Evict failed: ${err}`);
        },
      },
    );
  };

  return {
    reactorStatus,
    reactorStatusLoading,
    disableMutation,
    getPrimaryNode,
    isResourceActive,
    handleStop,
    handleStart,
    handleEvict,
  };
};
