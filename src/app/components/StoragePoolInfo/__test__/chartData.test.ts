// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { buildChartData, getSeriesIndexByGroupAndSide, hoveredChartItemOf, seriesTotalsOf } from '../chartData';

type Pool = {
  node_name: string;
  storage_pool_name: string;
  provider_kind: string;
  total_capacity?: number;
  free_capacity?: number;
};

const response = (data: Pool[]) => ({ data }) as unknown as Parameters<typeof buildChartData>[0];

const pool = (node: string, name: string, total: number, free: number, kind = 'LVM'): Pool => ({
  node_name: node,
  storage_pool_name: name,
  provider_kind: kind,
  total_capacity: total,
  free_capacity: free,
});

describe('buildChartData', () => {
  it('is empty without data or pools', () => {
    const empty = { series: [], categories: [], nodeSummaries: {}, totalNodeCount: 0 };
    expect(buildChartData(undefined, 'light')).toEqual(empty);
    expect(buildChartData(response([]), 'light')).toEqual(empty);
  });

  it('leaves out diskless pools and the nodes that only have those', () => {
    const data = buildChartData(response([pool('n1', 'sp', 100, 40), pool('n2', 'dl', 0, 0, 'DISKLESS')]), 'light');
    expect(data.categories).toEqual(['n1']);
    expect(data.totalNodeCount).toBe(1);
  });

  it('stacks used over free per pool and adds the node totals with more than one pool', () => {
    const data = buildChartData(
      response([pool('n1', 'a', 100, 40), pool('n1', 'b', 200, 50), pool('n2', 'a', 300, 100)]),
      'light',
    );
    // n1 carries more used space (210 against 200), so it comes first.
    expect(data.categories).toEqual(['n1', 'n2']);
    expect(data.series.map((s) => [s.name, s.group, s.data])).toEqual([
      ['a - Used', 'a', [60, 200]],
      ['a - Free', 'a', [40, 100]],
      ['b - Used', 'b', [150, 0]],
      ['b - Free', 'b', [50, 0]],
      ['Node - Used', 'NodeAll', [210, 200]],
      ['Node - Free', 'NodeAll', [90, 100]],
    ]);
  });

  it('draws the node totals in the gray of the current theme', () => {
    const pools = response([pool('n1', 'a', 100, 40), pool('n1', 'b', 200, 50)]);
    const nodeColors = (mode: 'light' | 'dark') =>
      buildChartData(pools, mode)
        .series.filter((s) => s.group === 'NodeAll')
        .map((s) => s.color);
    expect(nodeColors('light')).toEqual(['#3f3f3f', 'rgba(63, 63, 63, 0.2)']);
    expect(nodeColors('dark')).toEqual(['#8c8c8c', 'rgba(140, 140, 140, 0.2)']);
  });

  it('draws no node totals for a single pool', () => {
    const data = buildChartData(response([pool('n1', 'a', 100, 40), pool('n2', 'a', 100, 10)]), 'light');
    expect(data.series.map((s) => s.group)).toEqual(['a', 'a']);
  });

  it('summarises each node by pool, skipping pools it lacks, then the node total', () => {
    const data = buildChartData(
      response([pool('n1', 'a', 100, 40), pool('n1', 'b', 200, 50), pool('n2', 'a', 300, 100)]),
      'light',
    );
    expect(data.nodeSummaries.n2.map(({ label, free, used }) => ({ label, free, used }))).toEqual([
      { label: 'a', free: 100, used: 200 },
      { label: 'Node', free: 100, used: 200 },
    ]);
    expect(data.nodeSummaries.n1.map((row) => row.label)).toEqual(['a', 'b', 'Node']);
    expect(data.nodeSummaries.n1[0].usedColor).toBe(data.series[0].color);
  });

  it('draws only the 20 nodes with the most used space, and counts all of them', () => {
    const pools = Array.from({ length: 25 }, (_, i) => pool(`n${i}`, 'a', 1000, 1000 - i));
    const data = buildChartData(response(pools), 'light');
    expect(data.totalNodeCount).toBe(25);
    expect(data.categories).toHaveLength(20);
    expect(data.categories[0]).toBe('n24');
    expect(data.categories).not.toContain('n4');
  });
});

describe('series helpers', () => {
  const series = [
    { name: 'a - Used', group: 'a', side: 'used' as const, data: [1, 2], color: '#1' },
    { name: 'a - Free', group: 'a', side: 'free' as const, data: [3, 4], color: '#2' },
  ];

  it('sums every series over the nodes', () => {
    expect(seriesTotalsOf(series)).toEqual([3, 7]);
  });

  it('finds a series by pool and side', () => {
    expect(getSeriesIndexByGroupAndSide(series, 'a', 'free')).toBe(1);
    expect(getSeriesIndexByGroupAndSide(series, 'a', 'used')).toBe(0);
    expect(getSeriesIndexByGroupAndSide(series, 'b', 'used')).toBe(-1);
  });

  it('names the pool side of the first highlighted series', () => {
    expect(hoveredChartItemOf(series, [])).toBeNull();
    expect(hoveredChartItemOf(series, [1, 0])).toEqual({ group: 'a', side: 'free' });
    expect(hoveredChartItemOf(series, [5])).toBeNull();
  });

  it('tells free from used by the side, also for a pool whose name says Free', () => {
    const freePool = [
      { name: 'Free1 - Used', group: 'Free1', side: 'used' as const, data: [1], color: '#1' },
      { name: 'Free1 - Free', group: 'Free1', side: 'free' as const, data: [2], color: '#2' },
    ];
    expect(getSeriesIndexByGroupAndSide(freePool, 'Free1', 'used')).toBe(0);
    expect(hoveredChartItemOf(freePool, [0])).toEqual({ group: 'Free1', side: 'used' });
  });

  it('names the series without markup, so the chart tooltip shows plain text', () => {
    const names = buildChartData(
      { data: [{ node_name: 'n1', storage_pool_name: 'a', total_capacity: 10, free_capacity: 4 }] } as never,
      'light',
    ).series.map((s) => s.name);
    expect(names).toEqual(['a - Used', 'a - Free']);
  });
});
