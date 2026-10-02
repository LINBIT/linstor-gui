// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useRef, useState } from 'react';
import { HOVERED_NODE_CLEAR_DELAY } from './constants';
import { buildHoveredNodes, setHoveredNodeSegmentsState, setHoveredXAxisLabelState } from './chartDom';
import type { HoveredNode, SeriesItem } from './types';

type NodeHoverInput = {
  categories: string[];
  series: SeriesItem[];
  height: number;
  isPending: boolean;
};

/**
 * Which node's column the pointer is over. The hover regions are measured
 * from the rendered chart (again after a resize); entering one marks that
 * node's segments and axis label, and leaving it clears them after a short
 * delay so the pointer can move onto the node's tooltip.
 */
export const useNodeHover = ({ categories, series, height, isPending }: NodeHoverInput) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const hideHoveredNodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverableNodesFrameRef = useRef<number | null>(null);
  const activeHoveredNodeIndexRef = useRef<number | null>(null);
  const [hoverableNodes, setHoverableNodes] = useState<HoveredNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);

  const clearActiveHoveredNode = () => {
    if (activeHoveredNodeIndexRef.current === null) {
      return;
    }

    setHoveredNodeSegmentsState(chartContainerRef.current, activeHoveredNodeIndexRef.current, false);
    setHoveredXAxisLabelState(chartContainerRef.current, activeHoveredNodeIndexRef.current, false);
    activeHoveredNodeIndexRef.current = null;
  };

  const clearHoveredNodeTimer = () => {
    if (hideHoveredNodeTimerRef.current) {
      clearTimeout(hideHoveredNodeTimerRef.current);
      hideHoveredNodeTimerRef.current = null;
    }
  };

  const scheduleHoveredNodeClear = () => {
    clearHoveredNodeTimer();
    hideHoveredNodeTimerRef.current = setTimeout(() => {
      clearActiveHoveredNode();
      setHoveredNode(null);
      hideHoveredNodeTimerRef.current = null;
    }, HOVERED_NODE_CLEAR_DELAY);
  };

  const activateHoveredNode = (node: HoveredNode) => {
    clearHoveredNodeTimer();

    if (activeHoveredNodeIndexRef.current !== node.index) {
      clearActiveHoveredNode();
      setHoveredNodeSegmentsState(chartContainerRef.current, node.index, true);
      setHoveredXAxisLabelState(chartContainerRef.current, node.index, true);
      activeHoveredNodeIndexRef.current = node.index;
    }

    setHoveredNode(node);
  };

  const handleChartContainerMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement | null)?.closest('.storage-pool-node-tooltip')) {
      clearHoveredNodeTimer();
      return;
    }

    const container = chartContainerRef.current;
    if (!container || hoverableNodes.length === 0) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const nextHoveredNode = hoverableNodes.find((node) => {
      return (
        pointerX >= node.left &&
        pointerX <= node.left + node.width &&
        pointerY >= node.top &&
        pointerY <= node.top + node.height
      );
    });

    if (nextHoveredNode) {
      activateHoveredNode(nextHoveredNode);
      return;
    }

    scheduleHoveredNodeClear();
  };

  useEffect(() => {
    if (isPending || categories.length === 0) {
      setHoverableNodes([]);
      return;
    }

    const scheduleHoverableNodesUpdate = () => {
      if (hoverableNodesFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverableNodesFrameRef.current);
      }

      hoverableNodesFrameRef.current = window.requestAnimationFrame(() => {
        hoverableNodesFrameRef.current = null;
        setHoverableNodes(buildHoveredNodes(chartContainerRef.current, categories));
      });
    };

    const container = chartContainerRef.current;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && container
        ? new ResizeObserver(() => {
            scheduleHoverableNodesUpdate();
          })
        : null;

    scheduleHoverableNodesUpdate();
    window.addEventListener('resize', scheduleHoverableNodesUpdate);
    if (container) {
      resizeObserver?.observe(container);
    }

    return () => {
      if (hoverableNodesFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverableNodesFrameRef.current);
        hoverableNodesFrameRef.current = null;
      }

      window.removeEventListener('resize', scheduleHoverableNodesUpdate);
      resizeObserver?.disconnect();
    };
  }, [categories, series, height, isPending]);

  useEffect(() => {
    if (!hoveredNode) {
      return;
    }

    const nextHoveredNode = hoverableNodes.find((node) => node.name === hoveredNode.name);
    if (!nextHoveredNode) {
      clearActiveHoveredNode();
      setHoveredNode(null);
      return;
    }

    if (
      nextHoveredNode.left !== hoveredNode.left ||
      nextHoveredNode.top !== hoveredNode.top ||
      nextHoveredNode.width !== hoveredNode.width ||
      nextHoveredNode.height !== hoveredNode.height ||
      nextHoveredNode.index !== hoveredNode.index
    ) {
      setHoveredNode(nextHoveredNode);
    }
  }, [hoverableNodes, hoveredNode]);

  return {
    chartContainerRef,
    hoveredNode,
    clearHoveredNodeTimer,
    scheduleHoveredNodeClear,
    handleChartContainerMouseMove,
  };
};
