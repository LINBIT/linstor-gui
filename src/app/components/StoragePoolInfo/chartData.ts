// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { groupBy, union } from 'lodash';
import type { getStoragePool } from '@app/features/storagePool';
import { generateStoragePoolColorPairs, getNodeTotalColorPair } from '@app/utils/storagePoolColors';
import { normalizeStoragePoolSpace } from '@app/utils/storagePoolSpace';
import { MAX_NODES_TO_RENDER } from './constants';
import type { ChartData, ChartItem, NodeSummaryItem, SeriesItem } from './types';

type PoolsResponse = Awaited<ReturnType<typeof getStoragePool>>;

export const formatLegendLabel = (seriesName: string): string => seriesName.replace(/<[^>]+>/g, '').trim();

/** The stacked series (used and free per pool, plus node totals when there is
 *  more than one pool), the rendered nodes and each node's per-pool summary. */
export const buildChartData = (poolsData: PoolsResponse | undefined): ChartData => {
  if (!poolsData || poolsData?.data?.length === 0) {
    return {
      series: [],
      categories: [],
      nodeSummaries: {} as Record<string, NodeSummaryItem[]>,
      totalNodeCount: 0,
    };
  }

  // Filter out the DISKLESS provider kind
  const validPools = poolsData?.data?.filter((p) => p.provider_kind !== 'DISKLESS');

  // Group pools by node name for processing
  const groupedByNode = groupBy(validPools, 'node_name');
  const totalNodeCount = Object.keys(groupedByNode).length;

  // Cap the rendered nodes to the ones carrying the most capacity so the chart
  // stays responsive on large clusters. Sort by used desc, then total desc.
  const allNodes = Object.keys(groupedByNode)
    .map((node) => {
      const pools = groupedByNode[node];
      const total = pools.reduce(
        (acc, item) => acc + normalizeStoragePoolSpace(item.total_capacity, item.free_capacity).total,
        0,
      );
      const used = pools.reduce(
        (acc, item) => acc + normalizeStoragePoolSpace(item.total_capacity, item.free_capacity).used,
        0,
      );
      return { node, used, total };
    })
    .sort((a, b) => b.used - a.used || b.total - a.total)
    .slice(0, MAX_NODES_TO_RENDER)
    .map((entry) => entry.node);

  // Union of all unique storage pool names across the rendered nodes
  const allPools = union(...allNodes.map((node) => groupedByNode[node].map((sp) => sp.storage_pool_name)));

  const colorPairs = generateStoragePoolColorPairs(allPools.length);
  const nodeColorPair = getNodeTotalColorPair();

  const nodeTotals: Record<string, number> = {};
  const nodeUsed: Record<string, number> = {};
  const nodeSummaries: Record<string, NodeSummaryItem[]> = {};
  allNodes.forEach((node) => {
    const nodeSp = groupedByNode[node];
    nodeTotals[node] = nodeSp.reduce(
      (acc, item) => acc + normalizeStoragePoolSpace(item.total_capacity, item.free_capacity).total,
      0,
    );
    nodeUsed[node] = nodeSp.reduce(
      (acc, item) => acc + normalizeStoragePoolSpace(item.total_capacity, item.free_capacity).used,
      0,
    );
  });

  const spSeries: SeriesItem[] = [];
  allPools.forEach((pool, idx) => {
    const colorIndex = idx % colorPairs.length;
    const colors = colorPairs[colorIndex];

    const totalsForPool: number[] = [];
    const freeForPool: number[] = [];
    allNodes.forEach((node) => {
      const found = groupedByNode[node].find((i) => i.storage_pool_name === pool);
      const { total, free } = normalizeStoragePoolSpace(found?.total_capacity, found?.free_capacity);
      totalsForPool.push(total);
      freeForPool.push(free);
    });

    spSeries.push({
      name: `${pool} - <b>Used<b>`, // Show Used above
      group: pool,
      data: totalsForPool.map((total, idx) => total - freeForPool[idx]), // Used = Total - Free
      color: colors.used,
    });

    // Used data should come first (on top), followed by free data
    spSeries.push({
      name: `${pool} - <b>Free</b>`, // Show Free below
      group: pool,
      data: freeForPool,
      color: colors.free,
    });

    allNodes.forEach((node, nodeIndex) => {
      const total = totalsForPool[nodeIndex];
      const free = freeForPool[nodeIndex];
      const used = total - free;

      if (total <= 0 && free <= 0 && used <= 0) {
        return;
      }

      if (!nodeSummaries[node]) {
        nodeSummaries[node] = [];
      }

      nodeSummaries[node].push({
        label: pool,
        group: pool,
        free,
        used,
        freeColor: colorPairs[colorIndex].free,
        usedColor: colorPairs[colorIndex].used,
      });
    });
  });

  const nodeTotalSeries = {
    name: 'Node - <b>Free</b>', // Change the name to indicate free space
    group: 'NodeAll',
    data: allNodes.map((n) => nodeTotals[n] - nodeUsed[n]), // Free = Total - Used
    color: nodeColorPair.free,
  };

  const nodeUsedSeries = {
    name: 'Node - <b>Used</b>', // Used data should be on top
    group: 'NodeAll',
    data: allNodes.map((n) => nodeUsed[n]),
    color: nodeColorPair.used,
  };

  return {
    series: allPools.length > 1 ? [...spSeries, nodeUsedSeries, nodeTotalSeries] : [...spSeries],
    categories: allNodes,
    totalNodeCount,
    nodeSummaries: allNodes.reduce<Record<string, NodeSummaryItem[]>>((acc, node) => {
      acc[node] = [
        ...(nodeSummaries[node] || []),
        {
          label: 'Node',
          group: 'NodeAll',
          free: nodeTotals[node] - nodeUsed[node],
          used: nodeUsed[node],
          freeColor: nodeColorPair.free,
          usedColor: nodeColorPair.used,
        },
      ];
      return acc;
    }, {}),
  };
};

// Sum of each series over the rendered nodes, shown next to its legend
// label: the legend otherwise only highlights bars and gives no figure.
export const seriesTotalsOf = (series: SeriesItem[]): number[] =>
  series.map((seriesItem) => seriesItem.data.reduce((sum, value) => sum + value, 0));

export const getSeriesIndexByGroupAndSide = (series: SeriesItem[], group: string, side: 'free' | 'used'): number =>
  series.findIndex((s) => s.group === group && (side === 'free') === s.name.includes('Free'));

/** The pool side the first highlighted series stands for, if any. */
export const hoveredChartItemOf = (series: SeriesItem[], highlightedSeriesIndexes: number[]): ChartItem | null =>
  highlightedSeriesIndexes.length > 0
    ? (() => {
        const s = series[highlightedSeriesIndexes[0]];
        if (!s) return null;
        return { group: s.group, side: s.name.includes('Free') ? ('free' as const) : ('used' as const) };
      })()
    : null;
