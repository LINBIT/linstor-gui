// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { setHoveredSeriesState } from './chartDom';
import type { HoveredNode, SeriesItem } from './types';

type SeriesHighlightInput = {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  series: SeriesItem[];
  hoveredNode: HoveredNode | null;
};

/**
 * The series a legend item or tooltip metric points at, marked on the
 * rendered bars: across all nodes from the bottom legend, only the hovered
 * node's segment from its tooltip.
 */
export const useSeriesHighlight = ({ chartContainerRef, series, hoveredNode }: SeriesHighlightInput) => {
  const [highlightedLegendIndexes, setHighlightedLegendIndexes] = useState<number[]>([]);
  const [highlightedSeriesIndexes, setHighlightedSeriesIndexes] = useState<number[]>([]);
  const [isBottomLegendHover, setIsBottomLegendHover] = useState(false);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    // Highlighting from a node's tooltip should only light up that node's own
    // segment; the bottom legend still highlights the series across all nodes.
    const nodeIndex = !isBottomLegendHover && hoveredNode ? hoveredNode.index : null;

    series.forEach((_seriesItem, index) => {
      const isHovered = highlightedSeriesIndexes.includes(index);
      setHoveredSeriesState(container, index, isHovered, nodeIndex);
    });
  }, [series, highlightedSeriesIndexes, isBottomLegendHover, hoveredNode, chartContainerRef]);

  return {
    highlightedLegendIndexes,
    setHighlightedLegendIndexes,
    highlightedSeriesIndexes,
    setHighlightedSeriesIndexes,
    isBottomLegendHover,
    setIsBottomLegendHover,
  };
};
