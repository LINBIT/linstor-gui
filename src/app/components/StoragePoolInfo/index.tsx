// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useTranslation } from 'react-i18next';
import { groupBy, union } from 'lodash';
import { getStoragePool } from '@app/features/storagePool';
import { formatBytes } from '@app/utils/size';
import styled from '@emotion/styled';
import { useWindowSize } from '@app/hooks';
import { generateStoragePoolColorPairs, getNodeTotalColorPair } from '@app/utils/storagePoolColors';
type SeriesItem = {
  name: string;
  group: string;
  data: number[];
  color: string;
};

type NodeSummaryItem = {
  label: string;
  group: string;
  free: number;
  used: number;
  freeColor?: string;
  usedColor?: string;
};

type HoveredNode = {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
  name: string;
};

const ChartContainer = styled.div<{ enableScroll?: boolean }>`
  position: relative;
  overflow-x: ${(props) => (props.enableScroll ? 'auto' : 'visible')};

  .storage-pool-hovered-segment,
  .storage-pool-hovered-series-segment,
  .storage-pool-hovered-node-segment {
    stroke: #3f3f3f !important;
    stroke-width: 2px !important;
  }

  .storage-pool-hovered-xaxis-label {
    fill: #111827 !important;
    font-weight: 700 !important;
  }

  .storage-pool-node-overlay {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border: 1px solid rgba(17, 24, 39, 0.18);
    border-radius: 8px;
    background: transparent;
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
    overflow: hidden;
  }

  .storage-pool-node-tooltip {
    width: 100%;
    background: rgba(255, 255, 255, 0.92);
    padding: 10px 12px 12px;
    box-shadow: none;
    pointer-events: auto;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
  }

  .storage-pool-node-tooltip-content {
    min-width: max-content;
    display: grid;
    grid-template-columns: 60px max-content max-content;
    column-gap: 10px;
    row-gap: 6px;
    align-items: center;
    justify-content: start;
  }

  .storage-pool-node-details-spacer {
    width: 100%;
    flex: 0 0 auto;
  }

  .storage-pool-node-tooltip-row {
    display: contents;
    font-size: 13px;
    line-height: 1.4;
    cursor: default;
  }

  .storage-pool-node-tooltip-row.is-highlighted .storage-pool-node-tooltip-label {
    font-weight: 700;
    color: #111827;
    background: rgba(0, 0, 0, 0.04);
  }

  .storage-pool-node-tooltip-row.is-highlighted .storage-pool-node-tooltip-metric {
    color: #374151;
    background: rgba(0, 0, 0, 0.04);
  }

  .storage-pool-node-tooltip-label {
    font-weight: 400;
    color: #5f6368;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: 4px;
    padding: 1px 2px;
  }

  .storage-pool-node-tooltip-metric {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #6b7280;
    white-space: nowrap;
    font-size: 13px;
    border-radius: 3px;
    padding: 1px 2px;
    transition:
      background 80ms ease,
      color 80ms ease;
    cursor: default;
  }

  .storage-pool-node-tooltip-metric.is-highlighted {
    background: rgba(0, 0, 0, 0.06);
    color: #111827;
    font-weight: 600;
  }

  .storage-pool-node-tooltip-metric-dot {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex: 0 0 auto;
  }

  .storage-pool-custom-legend {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    justify-content: center;
  }

  .storage-pool-custom-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.4;
    cursor: default;
    user-select: none;
  }

  .storage-pool-custom-legend-item.is-highlighted {
    color: #111827;
    font-weight: 700;
  }

  .storage-pool-custom-legend-marker {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex: 0 0 auto;
  }
`;

const HOVERED_SEGMENT_CLASS = 'storage-pool-hovered-segment';
const HOVERED_SERIES_SEGMENT_CLASS = 'storage-pool-hovered-series-segment';
const HOVERED_NODE_SEGMENT_CLASS = 'storage-pool-hovered-node-segment';
const HOVERED_XAXIS_LABEL_CLASS = 'storage-pool-hovered-xaxis-label';
const NODE_OVERLAY_HORIZONTAL_INSET = 52;
const NODE_OVERLAY_MIN_WIDTH = 320;
const NODE_OVERLAY_MAX_WIDTH = 380;
const NODE_OVERLAY_TOP_PADDING = 8;
const HOVERED_NODE_CLEAR_DELAY = 120;
const NODE_DETAILS_PANEL_ROW_HEIGHT = 26;
const NODE_DETAILS_PANEL_PADDING = 28;
const NODE_DETAILS_PANEL_GAP = 8;

const formatLegendLabel = (seriesName: string): string => seriesName.replace(/<[^>]+>/g, '').trim();

const buildHoveredNodes = (containerElement: HTMLDivElement | null, nodeNames: string[]): HoveredNode[] => {
  if (!containerElement || nodeNames.length === 0) {
    return [];
  }

  const chartRoot = containerElement.querySelector('.apexcharts-canvas');
  if (!chartRoot || !containerElement) {
    return [];
  }

  const containerRect = containerElement.getBoundingClientRect();
  const plotRect = chartRoot.querySelector('.apexcharts-grid')?.getBoundingClientRect();
  const canvasRect = chartRoot.getBoundingClientRect();
  const xAxisLabels = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text');

  if (!plotRect || !canvasRect) {
    return [];
  }

  const plotLeft = plotRect.left - containerRect.left;
  const plotRight = plotRect.right - containerRect.left;
  const plotTop = plotRect.top - containerRect.top;
  const plotWidth = plotRect.width;

  const xAxisTextElements = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text');
  const xAxisTextsBottom =
    xAxisTextElements.length > 0
      ? Math.max(...Array.from(xAxisTextElements).map((el) => el.getBoundingClientRect().bottom - containerRect.top))
      : canvasRect.bottom - containerRect.top;
  const canvasBottom = xAxisTextsBottom + 20;
  const fallbackStep = plotWidth / nodeNames.length;
  const seriesElements = chartRoot.querySelectorAll('.apexcharts-bar-series .apexcharts-series');
  const overlayMinWidth = Math.min(
    NODE_OVERLAY_MAX_WIDTH,
    Math.max(NODE_OVERLAY_MIN_WIDTH, plotWidth / Math.max(nodeNames.length, 1) - 40),
  );

  const centers = nodeNames.map((_, index) => {
    const segmentRects = Array.from(seriesElements)
      .map((seriesElement) => seriesElement.querySelectorAll('path')[index]?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => Boolean(rect) && rect.width > 0);

    if (segmentRects.length > 0) {
      const left = Math.min(...segmentRects.map((rect) => rect.left - containerRect.left));
      const right = Math.max(...segmentRects.map((rect) => rect.right - containerRect.left));
      return (left + right) / 2;
    }

    const labelRect = xAxisLabels[index]?.getBoundingClientRect();
    if (labelRect) {
      return labelRect.left - containerRect.left + labelRect.width / 2;
    }

    return plotLeft + fallbackStep * index + fallbackStep / 2;
  });

  return nodeNames.map((nodeName, index) => {
    const currentCenter = centers[index];
    const previousCenter = centers[index - 1] ?? plotLeft;
    const nextCenter = centers[index + 1] ?? plotRight;
    const rawLeft = index === 0 ? plotLeft : (previousCenter + currentCenter) / 2;
    const rawRight = index === nodeNames.length - 1 ? plotRight : (currentCenter + nextCenter) / 2;
    const preferredWidth = Math.min(
      Math.max(rawRight - rawLeft - NODE_OVERLAY_HORIZONTAL_INSET * 2, overlayMinWidth),
      NODE_OVERLAY_MAX_WIDTH,
    );
    const maxLeft = Math.max(plotRight - preferredWidth, plotLeft);
    const left = Math.min(Math.max(currentCenter - preferredWidth / 2, plotLeft), maxLeft);
    const width = preferredWidth;
    const height = canvasBottom - plotTop;

    return {
      index,
      name: nodeName,
      left,
      top: Math.max(plotTop - NODE_OVERLAY_TOP_PADDING, 0),
      width,
      height,
    };
  });
};

const findSeriesElementByIndex = (root: ParentNode | null | undefined, seriesIndex: number): Element | null => {
  if (!root) {
    return null;
  }

  return (
    Array.from(root.querySelectorAll('.apexcharts-bar-series .apexcharts-series')).find((seriesElement) => {
      return (
        seriesElement.getAttribute('data:realIndex') === String(seriesIndex) ||
        seriesElement.getAttribute('data-realIndex') === String(seriesIndex)
      );
    }) || null
  );
};

const setHoveredNodeSegmentsState = (
  containerElement: HTMLDivElement | null,
  dataPointIndex: number,
  hovered: boolean,
) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  chartRoot.querySelectorAll('.apexcharts-bar-series .apexcharts-series').forEach((seriesElement) => {
    const segment = seriesElement.querySelectorAll('path')[dataPointIndex];
    if (!segment) {
      return;
    }

    segment.classList.toggle(HOVERED_NODE_SEGMENT_CLASS, hovered);
  });
};

const setHoveredXAxisLabelState = (
  containerElement: HTMLDivElement | null,
  dataPointIndex: number,
  hovered: boolean,
) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  const label = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text')[dataPointIndex];
  if (!label) {
    return;
  }

  label.classList.toggle(HOVERED_XAXIS_LABEL_CLASS, hovered);
};

const setHoveredSeriesState = (containerElement: HTMLDivElement | null, seriesIndex: number, hovered: boolean) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  const seriesElement = findSeriesElementByIndex(chartRoot, seriesIndex);
  if (!seriesElement) {
    return;
  }

  seriesElement.querySelectorAll('path').forEach((segment) => {
    segment.classList.toggle(HOVERED_SERIES_SEGMENT_CLASS, hovered);
  });
};

const setHoveredSegmentState = (
  chartContext: { el?: Element | null } | undefined,
  seriesIndex: number,
  dataPointIndex: number,
  hovered: boolean,
) => {
  const chartRoot = chartContext?.el;
  if (!chartRoot) {
    return;
  }

  const seriesElement = findSeriesElementByIndex(chartRoot, seriesIndex);
  const segment = seriesElement?.querySelectorAll('path')[dataPointIndex];

  if (!segment) {
    return;
  }

  segment.classList.toggle(HOVERED_SEGMENT_CLASS, hovered);
};

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

  const { height } = useWindowSize();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const hideHoveredNodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverableNodesFrameRef = useRef<number | null>(null);
  const activeHoveredNodeIndexRef = useRef<number | null>(null);
  const [hoverableNodes, setHoverableNodes] = useState<HoveredNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);
  const [highlightedLegendIndexes, setHighlightedLegendIndexes] = useState<number[]>([]);
  const [highlightedSeriesIndexes, setHighlightedSeriesIndexes] = useState<number[]>([]);

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

  const getLegendGroupIndexes = (seriesIndex: number): number[] => {
    const targetSeries = chartData.series[seriesIndex];
    if (!targetSeries) {
      return [];
    }

    return chartData.series.flatMap((seriesItem, index) => (seriesItem.group === targetSeries.group ? [index] : []));
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

  // Fetching the storage pool data from the API
  const { data: poolsData, isLoading } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const chartData = useMemo(() => {
    if (!poolsData || poolsData?.data?.length === 0) {
      return {
        series: [],
        categories: [],
        nodeSummaries: {} as Record<string, NodeSummaryItem[]>,
      };
    }

    // Filter out the DISKLESS provider kind
    const validPools = poolsData?.data?.filter((p) => p.provider_kind !== 'DISKLESS');

    // Group pools by node name for processing
    const groupedByNode = groupBy(validPools, 'node_name');
    const allNodes = Object.keys(groupedByNode);

    // Union of all unique storage pool names across all nodes
    const allPools = union(...allNodes.map((node) => groupedByNode[node].map((sp) => sp.storage_pool_name)));

    const colorPairs = generateStoragePoolColorPairs(allPools.length);
    const nodeColorPair = getNodeTotalColorPair();

    const nodeTotals: Record<string, number> = {};
    const nodeUsed: Record<string, number> = {};
    const nodeSummaries: Record<string, NodeSummaryItem[]> = {};
    allNodes.forEach((node) => {
      const nodeSp = groupedByNode[node];
      nodeTotals[node] = nodeSp.reduce((acc, item) => acc + (item.total_capacity || 0), 0);
      nodeUsed[node] = nodeSp.reduce((acc, item) => acc + ((item.total_capacity || 0) - (item.free_capacity || 0)), 0);
    });

    const spSeries: SeriesItem[] = [];
    allPools.forEach((pool, idx) => {
      const colorIndex = idx % colorPairs.length;
      const colors = colorPairs[colorIndex];

      const totalsForPool: number[] = [];
      const freeForPool: number[] = [];
      allNodes.forEach((node) => {
        const found = groupedByNode[node].find((i) => i.storage_pool_name === pool);
        const total = found?.total_capacity ?? 0;
        const free = found?.free_capacity ?? 0;
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
  }, [poolsData]);

  const getSeriesIndexByGroupAndSide = (group: string, side: 'free' | 'used'): number =>
    chartData.series.findIndex((s) => s.group === group && (side === 'free') === s.name.includes('Free'));

  const hoveredChartItem =
    highlightedSeriesIndexes.length > 0
      ? (() => {
          const s = chartData.series[highlightedSeriesIndexes[0]];
          if (!s) return null;
          return { group: s.group, side: s.name.includes('Free') ? ('free' as const) : ('used' as const) };
        })()
      : null;

  useEffect(() => {
    if (isLoading || chartData.categories.length === 0) {
      setHoverableNodes([]);
      return;
    }

    const scheduleHoverableNodesUpdate = () => {
      if (hoverableNodesFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverableNodesFrameRef.current);
      }

      hoverableNodesFrameRef.current = window.requestAnimationFrame(() => {
        hoverableNodesFrameRef.current = null;
        setHoverableNodes(buildHoveredNodes(chartContainerRef.current, chartData.categories));
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
    resizeObserver?.observe(container);

    return () => {
      if (hoverableNodesFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverableNodesFrameRef.current);
        hoverableNodesFrameRef.current = null;
      }

      window.removeEventListener('resize', scheduleHoverableNodesUpdate);
      resizeObserver?.disconnect();
    };
  }, [chartData.categories, chartData.series, height, isLoading]);

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

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    chartData.series.forEach((_seriesItem, index) => {
      setHoveredSeriesState(container, index, highlightedSeriesIndexes.includes(index));
    });
  }, [chartData.series, highlightedSeriesIndexes]);

  const options: ApexOptions = {
    chart: {
      stacked: true,
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
      toolbar: {
        show: false,
      },
      events: {
        dataPointMouseEnter: (_event, chartContext, config) => {
          clearHoveredNodeTimer();
          setHoveredSegmentState(chartContext, config.seriesIndex, config.dataPointIndex, true);
          setHighlightedSeriesIndexes([config.seriesIndex]);
          setHighlightedLegendIndexes(getLegendGroupIndexes(config.seriesIndex));
        },
        dataPointMouseLeave: (_event, chartContext, config) => {
          setHoveredSegmentState(chartContext, config.seriesIndex, config.dataPointIndex, false);
          setHighlightedSeriesIndexes((current) =>
            current.length === 1 && current[0] === config.seriesIndex ? [] : current,
          );
          setHighlightedLegendIndexes((current) => {
            const leavingIndexes = getLegendGroupIndexes(config.seriesIndex);
            const currentKey = current.join(',');
            const leavingKey = leavingIndexes.join(',');
            return currentKey === leavingKey ? [] : current;
          });
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '20%',
      },
    },
    xaxis: {
      categories: chartData.categories,
    },
    legend: {
      show: false,
      position: 'bottom' as const,
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatBytes(val),
      },
    },
    fill: {
      opacity: 1,
    },
    stroke: {
      width: 1,
      colors: ['#fff'],
    },
  };

  const nodeCount = chartData.categories.length;
  const chartWidth = nodeCount * 400;
  const hoveredNodeDetails = hoveredNode ? chartData.nodeSummaries[hoveredNode.name] || [] : [];
  const hoveredNodeSpRows = hoveredNodeDetails.filter((item) => item.label !== 'Node');
  const hoveredNodeTotalRow = hoveredNodeDetails.find((item) => item.label === 'Node') ?? null;
  const tooltipPanelHeight = hoveredNodeDetails.length * NODE_DETAILS_PANEL_ROW_HEIGHT + NODE_DETAILS_PANEL_PADDING;

  const widthForChart =
    nodeCount >= 5
      ? {
          width: chartWidth,
        }
      : {};

  return (
    <div className="border-2 border-gray-200 rounded px-[34px] py-[30px]">
      <h3 className="m-0 mb-4 text-[26px] font-semibold">{t('common:storage_pool_overview')}</h3>
      <Spin spinning={isLoading}>
        <ChartContainer
          enableScroll={nodeCount >= 5}
          ref={chartContainerRef}
          onMouseMove={handleChartContainerMouseMove}
          onMouseLeave={scheduleHoveredNodeClear}
        >
          {hoveredNode && (
            <div
              className="storage-pool-node-overlay"
              style={{
                left: hoveredNode.left,
                top: hoveredNode.top,
                width: hoveredNode.width,
                height: hoveredNode.height + tooltipPanelHeight,
              }}
            >
              <div
                className="storage-pool-node-tooltip"
                key={hoveredNode.name}
                onMouseEnter={clearHoveredNodeTimer}
                onMouseLeave={() => {
                  setHighlightedSeriesIndexes([]);
                  setHighlightedLegendIndexes([]);
                  scheduleHoveredNodeClear();
                }}
              >
                <div className="storage-pool-node-tooltip-content">
                  {[...hoveredNodeSpRows, ...(hoveredNodeTotalRow ? [hoveredNodeTotalRow] : [])].map((item) => {
                    const isFreeHighlighted =
                      hoveredChartItem?.group === item.group && hoveredChartItem?.side === 'free';
                    const isUsedHighlighted =
                      hoveredChartItem?.group === item.group && hoveredChartItem?.side === 'used';
                    return (
                      <div className="storage-pool-node-tooltip-row" key={`${hoveredNode.name}-${item.label}`}>
                        <div className="storage-pool-node-tooltip-label">{item.label}</div>
                        <div
                          className={`storage-pool-node-tooltip-metric${isFreeHighlighted ? ' is-highlighted' : ''}`}
                          onMouseEnter={() => {
                            const idx = getSeriesIndexByGroupAndSide(item.group, 'free');
                            if (idx >= 0) {
                              setHighlightedSeriesIndexes([idx]);
                              setHighlightedLegendIndexes([idx]);
                            }
                          }}
                        >
                          {item.freeColor && (
                            <span
                              className="storage-pool-node-tooltip-metric-dot"
                              style={{ background: item.freeColor }}
                            />
                          )}
                          {`Free: ${formatBytes(item.free)}`}
                        </div>
                        <div
                          className={`storage-pool-node-tooltip-metric${isUsedHighlighted ? ' is-highlighted' : ''}`}
                          onMouseEnter={() => {
                            const idx = getSeriesIndexByGroupAndSide(item.group, 'used');
                            if (idx >= 0) {
                              setHighlightedSeriesIndexes([idx]);
                              setHighlightedLegendIndexes([idx]);
                            }
                          }}
                        >
                          {item.usedColor && (
                            <span
                              className="storage-pool-node-tooltip-metric-dot"
                              style={{ background: item.usedColor }}
                            />
                          )}
                          {`Used: ${formatBytes(item.used)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <Chart
            options={options}
            series={chartData.series}
            type="bar"
            height={height > 900 ? 500 : 300}
            {...widthForChart}
          />
          {hoveredNode && (
            <div
              className="storage-pool-node-details-spacer"
              style={{ height: tooltipPanelHeight + NODE_DETAILS_PANEL_GAP }}
            />
          )}
          <div className="storage-pool-custom-legend">
            {chartData.series.map((seriesItem, index) => (
              <div
                className={`storage-pool-custom-legend-item${
                  highlightedLegendIndexes.includes(index) ? ' is-highlighted' : ''
                }`}
                key={`${seriesItem.name}-${index}`}
                onMouseEnter={() => {
                  setHighlightedSeriesIndexes([index]);
                  setHighlightedLegendIndexes([index]);
                }}
                onMouseLeave={() => {
                  setHighlightedSeriesIndexes((current) =>
                    current.length === 1 && current[0] === index ? [] : current,
                  );
                  setHighlightedLegendIndexes((current) =>
                    current.length === 1 && current[0] === index ? [] : current,
                  );
                }}
              >
                <span className="storage-pool-custom-legend-marker" style={{ background: seriesItem.color }} />
                <span>{formatLegendLabel(seriesItem.name)}</span>
              </div>
            ))}
          </div>
        </ChartContainer>
      </Spin>
    </div>
  );
};
