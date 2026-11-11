// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState, useMemo, useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNodes } from '@app/features/node/hooks/useNode';
import {
  useDrbdReactorStatus,
  useDrbdReactorFailures,
  useEvictDrbdReactor,
  useDisableDrbdReactor,
  useEnableDrbdReactor,
} from './useHA';
import { getEvictOutcome } from './evict';
import type { DrbdReactorReport } from './api';
import {
  type HARecord,
  type ReactorStatus,
  REACTOR_STATUS_POLL_MS,
  TAKEOVER_WAIT_MS,
  activeNodeInStatus,
  decodeExecText,
  getConfigName,
  isResourceActiveInStatus,
  resourceNodesInStatus,
  syncEvictedResourceInStatus,
} from './haStatus';

// The one message an evict shows: its progress, then its outcome in place.
const EVICT_MESSAGE_KEY = 'evict-in-progress';

/**
 * The cluster's DRBD Reactor status and the actions that change it: evict,
 * stop and start. Each action ends once the polled status shows its result.
 */
export const useReactorActions = () => {
  const { t } = useTranslation(['ha']);
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
  const [startingResource, setStartingResource] = useState<string | null>(null);
  const [startStartedAt, setStartStartedAt] = useState<number | null>(null);
  // An evict that named the node taking over: that node still has to start the services, so the status
  // is polled until it reports them active (or the wait runs out), not just read once while they start.
  const [takeover, setTakeover] = useState<{ resourceName: string; node: string; startedAt: number } | null>(null);
  // Resources whose evict, stop or start request has been sent and not answered yet; once it is answered,
  // the evict, takeover, stop or start state above takes over until the status shows the result.
  const [requestedResources, setRequestedResources] = useState<ReadonlySet<string>>(new Set());
  const markRequested = (resourceName: string, requested: boolean) =>
    setRequestedResources((current) => {
      if (current.has(resourceName) === requested) return current;
      const next = new Set(current);
      if (requested) next.add(resourceName);
      else next.delete(resourceName);
      return next;
    });

  // The status of every node is read once for the page.
  const {
    data: clusterStatus,
    isLoading: reactorStatusLoading,
    dataUpdatedAt: clusterStatusUpdatedAt,
  } = useDrbdReactorStatus(nodeNames, nodeNames.length > 0);
  const { data: reactorFailures } = useDrbdReactorFailures(nodeNames);

  // While an evict, stop, start or takeover settles, only the nodes of the resources it concerns are asked,
  // every second. A stopped resource is reported on no node, so its start asks every node; a stop that
  // has settled is reported on no node either, and asks none until it is marked done.
  const settlingNodes = useMemo(() => {
    const settling = [evictingResource?.resourceName, takeover?.resourceName, stoppingResource, startingResource];
    const asked = new Set<string>();
    for (const resourceName of settling) {
      if (!resourceName) continue;
      const nodes = resourceNodesInStatus(clusterStatus, resourceName);
      const startAsksAll = nodes.length === 0 && resourceName === startingResource;
      for (const node of startAsksAll ? nodeNames : nodes) asked.add(node);
    }
    return nodeNames.filter((node) => asked.has(node));
  }, [clusterStatus, nodeNames, evictingResource, takeover, stoppingResource, startingResource]);
  const { data: settlingStatus, dataUpdatedAt: settlingStatusUpdatedAt } = useDrbdReactorStatus(
    settlingNodes,
    settlingNodes.length > 0,
    REACTOR_STATUS_POLL_MS,
  );

  // What those nodes answer goes into the page's status of the cluster too, so it stays when the polling ends
  // and the other nodes need no new read.
  const settlingIsSeparate = settlingNodes.length > 0 && settlingNodes.length < nodeNames.length;
  useEffect(() => {
    if (!settlingIsSeparate || !settlingStatus) return;
    queryClient.setQueryData<DrbdReactorReport | undefined>(['drbd-reactor-status', nodeNames], (report) =>
      report ? { ...report, status: { ...report.status, ...settlingStatus } } : report,
    );
  }, [queryClient, nodeNames, settlingIsSeparate, settlingStatus]);

  // What those nodes answered last stands in for what the page read of them before.
  const settlingIsNewer = !!settlingStatus && settlingStatusUpdatedAt > clusterStatusUpdatedAt;
  const reactorStatus = useMemo<ReactorStatus | undefined>(
    () => (settlingIsNewer ? { ...clusterStatus, ...settlingStatus } : clusterStatus),
    [settlingIsNewer, clusterStatus, settlingStatus],
  );
  const reactorStatusUpdatedAt = settlingIsNewer ? settlingStatusUpdatedAt : clusterStatusUpdatedAt;

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

    // The outcome takes the progress message's place (same key). Destroying
    // the progress message and opening another at times left the progress
    // message on screen for good when the evict answered at once.
    message.success({
      key: EVICT_MESSAGE_KEY,
      content:
        outcome.status === 'migrated'
          ? t('ha:migrated', { name: resourceName, node: outcome.newNode })
          : t('ha:evicted', { name: resourceName }),
    });
    setEvictingResource(null);
    setEvictStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, evictStartedAt, evictingResource, t]);

  useEffect(() => {
    if (!takeover || !reactorStatus || reactorStatusUpdatedAt <= takeover.startedAt) return;
    const started = activeNodeInStatus(reactorStatus, takeover.resourceName) === takeover.node;
    if (!started && reactorStatusUpdatedAt - takeover.startedAt < TAKEOVER_WAIT_MS) return;
    setTakeover(null);
  }, [reactorStatus, reactorStatusUpdatedAt, takeover]);

  useEffect(() => {
    if (!stoppingResource || !reactorStatus) return;
    if (stopStartedAt !== null && reactorStatusUpdatedAt <= stopStartedAt) return;
    if (isResourceActiveInStatus(reactorStatus, stoppingResource)) return;

    message.destroy('stop-in-progress');
    message.success(t('ha:stopped', { name: stoppingResource }));
    setStoppingResource(null);
    setStopStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, stopStartedAt, stoppingResource, t]);

  useEffect(() => {
    if (!startingResource || !reactorStatus) return;
    if (startStartedAt !== null && reactorStatusUpdatedAt <= startStartedAt) return;
    if (!isResourceActiveInStatus(reactorStatus, startingResource)) return;

    message.destroy('start-in-progress');
    message.success(t('ha:started', { name: startingResource }));
    setStartingResource(null);
    setStartStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ['resources-view'] });
    queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
  }, [queryClient, reactorStatus, reactorStatusUpdatedAt, startStartedAt, startingResource, t]);

  const getPrimaryNode = (resourceName: string): string | null => activeNodeInStatus(reactorStatus, resourceName);

  /**
   * Whether an evict, stop or start of the resource has not settled yet: from the moment it is sent until the
   * status shows its result. Its running state is in between until then, so the row does not show one.
   */
  const isResourceSettling = (resourceName: string): boolean =>
    requestedResources.has(resourceName) ||
    evictingResource?.resourceName === resourceName ||
    takeover?.resourceName === resourceName ||
    stoppingResource === resourceName ||
    startingResource === resourceName;

  /** The node an evict moved the resource to while that node still starts the services, else null. */
  const getTakeoverNode = (resourceName: string): string | null =>
    takeover?.resourceName === resourceName ? takeover.node : null;

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
      message.warning(t('ha:no_config_stop', { name: record.name }));
      return;
    }

    const activeNode = getPrimaryNode(record.name);
    const allNodes = resourceNodesInStatus(reactorStatus, record.name);

    if (allNodes.length === 0) {
      message.warning(t('ha:not_on_any_node', { name: record.name }));
      return;
    }

    const nonActiveNodes = allNodes.filter((n) => n !== activeNode);

    message.loading({ content: t('ha:stopping', { name: record.name }), key: 'stop-in-progress', duration: 0 });
    markRequested(record.name, true);

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
        content: t('ha:stopping_wait', { name: record.name }),
        key: 'stop-in-progress',
        duration: 0,
      });
      const startedAt = Date.now();
      setStopStartedAt(startedAt);
      setStoppingResource(record.name);
    } catch (err) {
      setStoppingResource(null);
      setStopStartedAt(null);
      message.destroy('stop-in-progress');
      message.error(t('ha:stop_failed', { name: record.name, error: String(err) }));
    } finally {
      markRequested(record.name, false);
    }
  };

  /**
   * Handle start: enable on all nodes.
   */
  const handleStart = async (record: HARecord) => {
    const configName = getConfigName(record);
    if (!configName) {
      message.warning(t('ha:no_config_start', { name: record.name }));
      return;
    }

    // When stopped, DRBD Reactor doesn't report the resource, so fall back to all cluster nodes
    const allNodes = resourceNodesInStatus(reactorStatus, record.name);
    const targetNodes = allNodes.length > 0 ? allNodes : nodeNames;

    if (targetNodes.length === 0) {
      message.warning(t('ha:no_nodes_to_start', { name: record.name }));
      return;
    }

    message.loading({ content: t('ha:starting', { name: record.name }), key: 'start-in-progress', duration: 0 });
    markRequested(record.name, true);

    try {
      await enableMutation.mutateAsync({ nodes: targetNodes, config: configName });
      message.loading({
        content: t('ha:starting_wait', { name: record.name }),
        key: 'start-in-progress',
        duration: 0,
      });
      const startedAt = Date.now();
      setStartStartedAt(startedAt);
      setStartingResource(record.name);
    } catch (err) {
      message.destroy('start-in-progress');
      message.error(t('ha:start_failed', { name: record.name, error: String(err) }));
    } finally {
      markRequested(record.name, false);
    }
  };

  const handleEvict = (record: HARecord) => {
    const primaryNode = getPrimaryNode(record.name);

    if (!primaryNode) {
      message.warning(t('ha:no_active_node_evict', { name: record.name }));
      return;
    }

    const configName = getConfigName(record);
    if (!configName) {
      message.warning(t('ha:no_config_evict', { name: record.name }));
      return;
    }

    message.loading({
      content: t('ha:evicting', { name: record.name, node: primaryNode }),
      key: EVICT_MESSAGE_KEY,
      duration: 0,
    });
    markRequested(record.name, true);

    evictMutation.mutate(
      { nodes: [primaryNode], resource: configName, wait: true },
      {
        onSuccess: (results) => {
          const result = results[0];
          if (result && result.exit_code !== 0) {
            setEvictingResource(null);
            setEvictStartedAt(null);
            message.error({
              key: EVICT_MESSAGE_KEY,
              content: t('ha:evict_failed', {
                error: decodeExecText(result.stderr_utf8) || t('ha:exit_code', { code: result.exit_code }),
              }),
            });
            return;
          }

          if (result?.active_node) {
            setEvictingResource(null);
            setEvictStartedAt(null);
            // The cache holds the whole report; the node that took over is shown at once.
            queryClient.setQueryData<DrbdReactorReport | undefined>(['drbd-reactor-status', nodeNames], (report) =>
              report
                ? {
                    ...report,
                    status:
                      syncEvictedResourceInStatus(report.status, record.name, result.active_node as string) ??
                      report.status,
                  }
                : report,
            );
            message.success({
              key: EVICT_MESSAGE_KEY,
              content: t('ha:migrated', { name: record.name, node: result.active_node }),
            });
            setTakeover({ resourceName: record.name, node: result.active_node, startedAt: Date.now() });
            queryClient.invalidateQueries({ queryKey: ['resources-view'] });
            queryClient.invalidateQueries({ queryKey: ['ha-resource-definitions'] });
            return;
          }

          message.loading({
            content: t('ha:evicting_wait', { name: record.name, node: primaryNode }),
            key: EVICT_MESSAGE_KEY,
            duration: 0,
          });
          const startedAt = Date.now();
          setEvictStartedAt(startedAt);
          setEvictingResource({ resourceName: record.name, fromNode: primaryNode });
        },
        onError: (err) => {
          setEvictingResource(null);
          setEvictStartedAt(null);
          message.error({ key: EVICT_MESSAGE_KEY, content: t('ha:evict_failed', { error: String(err) }) });
        },
        onSettled: () => markRequested(record.name, false),
      },
    );
  };

  return {
    nodeNames,
    reactorStatus,
    reactorStatusLoading,
    reactorFailures,
    disableMutation,
    getPrimaryNode,
    isResourceActive,
    isResourceSettling,
    getTakeoverNode,
    handleStop,
    handleStart,
    handleEvict,
  };
};
