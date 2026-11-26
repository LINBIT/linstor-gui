// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';

import { getResources } from '../api';
import { hasSyncingVolume } from '../components/overview/rows';
import type { ResourceDataType } from '../types';

/**
 * Every resource of the cluster with its live state (/v1/view/resources). All
 * views share this one cache entry and pick what they need with `select`, so a
 * page that shows several of them still fetches the list once per poll.
 */
export const RESOURCES_VIEW_QUERY_KEY = ['resources-view'];

/** How often the list is read while a volume syncs, so its progress moves. */
export const SYNC_POLL_MS = 1000;

/** How often it is read otherwise: the view grows with the cluster (MBs at thousands of resources). */
export const IDLE_POLL_MS = 10000;

export const fetchResourcesView = async (): Promise<ResourceDataType[]> => (await getResources()).data ?? [];

interface ResourcesViewOptions<T> {
  select?: (resources: ResourceDataType[]) => T;
  /**
   * Read every second while a volume syncs. Only for views that show sync
   * progress: the whole cluster's view at that rate is heavy, so the other
   * views keep the idle rate. Observers of one query reschedule on every
   * update, so the fastest one sets the pace and there is still one request.
   */
  fastWhileSyncing?: boolean;
  enabled?: boolean;
}

export const useResourcesView = <T = ResourceDataType[]>({
  select,
  fastWhileSyncing = false,
  enabled = true,
}: ResourcesViewOptions<T> = {}) =>
  useQuery({
    queryKey: RESOURCES_VIEW_QUERY_KEY,
    queryFn: fetchResourcesView,
    select,
    enabled,
    refetchInterval: (q) => (fastWhileSyncing && hasSyncingVolume(q.state.data) ? SYNC_POLL_MS : IDLE_POLL_MS),
    refetchIntervalInBackground: false,
  });
