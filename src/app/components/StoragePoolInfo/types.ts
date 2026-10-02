// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export type SeriesItem = {
  name: string;
  group: string;
  data: number[];
  color: string;
};

export type NodeSummaryItem = {
  label: string;
  group: string;
  free: number;
  used: number;
  freeColor?: string;
  usedColor?: string;
};

export type HoveredNode = {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
  name: string;
};

export type ChartData = {
  series: SeriesItem[];
  categories: string[];
  nodeSummaries: Record<string, NodeSummaryItem[]>;
  totalNodeCount: number;
};

/** The series a tooltip metric or legend item highlights: a pool (or the node
 *  total) and its free or used side. */
export type ChartItem = { group: string; side: 'free' | 'used' };
