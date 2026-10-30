// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResourceDefinition, ResourceDefinitionListQuery } from '@app/features/resourceDefinition';
import { getResources } from '../../api';
import { hasSyncingVolume, mergeOverviewRows } from './rows';

/** How often the live resource state is read while a volume syncs, so its progress moves. */
export const SYNC_POLL_MS = 1000;

/** How often it is read otherwise: the full view grows with the cluster (MBs at thousands of resources). */
export const IDLE_POLL_MS = 10000;

/** The overview's rows: the definitions matching `query`, each with its deployed volumes. */
export const useOverviewData = (query: ResourceDefinitionListQuery) => {
  const fetchResourceDefinitions = async () => {
    const data = await getResourceDefinition({
      ...query,
      with_volume_definitions: true,
    });

    return data?.data ?? [];
  };

  const fetchResourcesView = async () => (await getResources()).data ?? [];

  const {
    data: resourceDefinitions,
    isPending: rdLoading,
    refetch: refetchResourceDefinitions,
  } = useQuery({
    queryKey: ['getResourceDefinitionList', query],
    queryFn: fetchResourceDefinitions,
    // Definitions/props/layers rarely change during a sync. Polling slow keeps
    // the controller load down even on large clusters.
    refetchInterval: 10000,
  });

  // Live state (disk_state, replication_states, done_percentage, in_use) is
  // fetched separately so it can poll fast during a sync without re-pulling
  // the resource-definition payload. Fast only while something syncs: the view
  // holds every resource of the cluster, so at a 1s cadence a large cluster
  // pulls megabytes a second and the controller builds the whole view each time.
  const {
    data: resourcesView,
    isPending: rvLoading,
    refetch: refetchResourcesView,
  } = useQuery({
    queryKey: ['getResourcesView'],
    queryFn: fetchResourcesView,
    refetchInterval: (q) => (hasSyncingVolume(q.state.data) ? SYNC_POLL_MS : IDLE_POLL_MS),
    refetchIntervalInBackground: false,
  });

  const resourceDefinitionList = useMemo(
    () => mergeOverviewRows(resourceDefinitions, resourcesView),
    [resourceDefinitions, resourcesView],
  );

  const isPending = rdLoading || rvLoading;
  const refetch = useCallback(() => {
    void refetchResourceDefinitions();
    void refetchResourcesView();
  }, [refetchResourceDefinitions, refetchResourcesView]);

  // Awaitable twin of refetch, so a delete keeps its row busy until both lists have reloaded.
  const reloadAll = () => Promise.all([refetchResourceDefinitions(), refetchResourcesView()]);

  return { resourceDefinitionList, isPending, refetch, reloadAll };
};
