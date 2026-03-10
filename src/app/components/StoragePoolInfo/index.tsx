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
  free: number;
  used: number;
};

type HoveredNode = {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
  triggerTop: number;
  triggerLeft: number;
  triggerWidth: number;
  triggerHeight: number;
  name: string;
  details: NodeSummaryItem[];
};

const ChartContainer = styled.div<{ enableScroll?: boolean }>`
  position: relative;
  overflow-x: ${(props) => (props.enableScroll ? 'auto' : 'visible')};

  .storage-pool-hovered-segment {
    stroke: #3f3f3f !important;
    stroke-width: 2px !important;
  }

  .storage-pool-hovered-legend,
  .storage-pool-hovered-legend .apexcharts-legend-text {
    color: #111827 !important;
    fill: #111827 !important;
    font-weight: 700 !important;
  }

  .storage-pool-hovered-xaxis-label {
    fill: #111827 !important;
    font-weight: 700 !important;
  }

  .storage-pool-node-overlay {
    position: absolute;
    border: 1px solid rgba(17, 24, 39, 0.18);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(1px);
    pointer-events: none;
    transition: opacity 120ms ease;
    z-index: 2;
  }

  .storage-pool-node-hover-zone {
    position: absolute;
    background: transparent;
    z-index: 4;
  }

  .storage-pool-node-tooltip {
    position: absolute;
    width: 280px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
    padding: 10px 12px 12px;
    pointer-events: auto;
    z-index: 3;
  }

  .storage-pool-node-tooltip-header,
  .storage-pool-node-tooltip-row {
    display: grid;
    grid-template-columns: minmax(88px, 1.2fr) minmax(84px, 1fr) minmax(84px, 1fr);
    align-items: center;
    gap: 8px;
    font-size: 12px;
    line-height: 1.4;
  }

  .storage-pool-node-tooltip-header {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
    color: #6b7280;
    font-weight: 700;
  }

  .storage-pool-node-tooltip-body {
    max-height: 168px;
    overflow-y: auto;
    padding-right: 2px;
  }

  .storage-pool-node-tooltip-row + .storage-pool-node-tooltip-row {
    margin-top: 6px;
  }

  .storage-pool-node-tooltip-label {
    font-weight: 600;
    color: #111827;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .storage-pool-node-tooltip-metric {
    color: #4b5563;
    white-space: nowrap;
  }
`;

const HOVERED_SEGMENT_CLASS = 'storage-pool-hovered-segment';
const HOVERED_LEGEND_CLASS = 'storage-pool-hovered-legend';
const HOVERED_XAXIS_LABEL_CLASS = 'storage-pool-hovered-xaxis-label';
const NODE_OVERLAY_HORIZONTAL_INSET = 10;
const NODE_OVERLAY_TOP_PADDING = 8;
const NODE_OVERLAY_BOTTOM_PADDING = 18;
const NODE_TOOLTIP_WIDTH = 280;
const HOVERED_NODE_CLEAR_DELAY = 120;
const NODE_LABEL_TRIGGER_PADDING_X = 16;
const NODE_LABEL_TRIGGER_PADDING_Y = 8;

const buildHoveredNodes = (
  containerElement: HTMLDivElement | null,
  nodeNames: string[],
  nodeSummaries: Record<string, NodeSummaryItem[]>,
): HoveredNode[] => {
  if (!containerElement || nodeNames.length === 0) {
    return [];
  }

  const chartRoot = containerElement.querySelector('.apexcharts-canvas');
  if (!chartRoot || !containerElement) {
    return [];
  }

  const containerRect = containerElement.getBoundingClientRect();
  const plotRect = chartRoot.querySelector('.apexcharts-grid')?.getBoundingClientRect();
  const xAxisLabels = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text');

  if (!plotRect) {
    return [];
  }

  const plotLeft = plotRect.left - containerRect.left;
  const plotRight = plotRect.right - containerRect.left;
  const plotTop = plotRect.top - containerRect.top;
  const plotWidth = plotRect.width;
  const fallbackStep = plotWidth / nodeNames.length;

  const centers = nodeNames.map((_, index) => {
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
    const labelRect = xAxisLabels[index]?.getBoundingClientRect();
    const rawLeft = index === 0 ? plotLeft : (previousCenter + currentCenter) / 2;
    const rawRight = index === nodeNames.length - 1 ? plotRight : (currentCenter + nextCenter) / 2;
    const left = Math.max(rawLeft + NODE_OVERLAY_HORIZONTAL_INSET, 0);
    const width = Math.max(rawRight - rawLeft - NODE_OVERLAY_HORIZONTAL_INSET * 2, 48);
    const height =
      (labelRect?.bottom ? labelRect.bottom - containerRect.top : plotTop + 24) - plotTop + NODE_OVERLAY_BOTTOM_PADDING;
    const triggerLeft = labelRect
      ? Math.max(labelRect.left - containerRect.left - NODE_LABEL_TRIGGER_PADDING_X, left)
      : left;
    const triggerWidth = labelRect
      ? Math.max(Math.min(labelRect.width + NODE_LABEL_TRIGGER_PADDING_X * 2, left + width - triggerLeft), 56)
      : Math.min(width, 72);
    const triggerTop = labelRect
      ? labelRect.top - containerRect.top - NODE_LABEL_TRIGGER_PADDING_Y
      : plotTop + height - 28;
    const triggerHeight = labelRect ? labelRect.height + NODE_LABEL_TRIGGER_PADDING_Y * 2 : 28;

    return {
      index,
      name: nodeName,
      details: nodeSummaries[nodeName] || [],
      left,
      top: Math.max(plotTop - NODE_OVERLAY_TOP_PADDING, 0),
      width,
      height,
      triggerLeft,
      triggerTop,
      triggerWidth,
      triggerHeight,
    };
  });
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

    segment.classList.toggle(HOVERED_SEGMENT_CLASS, hovered);
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

  const seriesElement = chartRoot.querySelector(
    `.apexcharts-series[data\\:realIndex="${seriesIndex}"], .apexcharts-series[data-realIndex="${seriesIndex}"]`,
  );
  if (!seriesElement) {
    return;
  }

  seriesElement.querySelectorAll('path').forEach((segment) => {
    segment.classList.toggle(HOVERED_SEGMENT_CLASS, hovered);
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

  const seriesElement = chartRoot.querySelector(
    `.apexcharts-series[data\\:realIndex="${seriesIndex}"], .apexcharts-series[data-realIndex="${seriesIndex}"]`,
  );
  const segment = seriesElement?.querySelectorAll('path')[dataPointIndex];

  if (!segment) {
    return;
  }

  segment.classList.toggle(HOVERED_SEGMENT_CLASS, hovered);
};

const setHoveredLegendState = (
  chartContext: { el?: Element | null } | undefined,
  seriesIndex: number,
  hovered: boolean,
) => {
  const chartRoot = chartContext?.el;
  if (!chartRoot) {
    return;
  }

  const legendSeries = chartRoot.querySelectorAll('.apexcharts-legend-series')[seriesIndex];
  if (!legendSeries) {
    return;
  }

  legendSeries.classList.toggle(HOVERED_LEGEND_CLASS, hovered);
};

const setHoveredLegendGroupState = (
  containerElement: HTMLDivElement | null,
  series: SeriesItem[],
  seriesIndex: number,
  hovered: boolean,
) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  const targetSeries = series[seriesIndex];
  if (!targetSeries) {
    return;
  }

  const legendItems = chartRoot.querySelectorAll('.apexcharts-legend-series');
  series.forEach((seriesItem, index) => {
    if (seriesItem.group !== targetSeries.group) {
      return;
    }

    const legendItem = legendItems[index];
    if (!legendItem) {
      return;
    }

    legendItem.classList.toggle(HOVERED_LEGEND_CLASS, hovered);
  });
};

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

  const { height } = useWindowSize();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const hideHoveredNodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          free,
          used,
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
            free: nodeTotals[node] - nodeUsed[node],
            used: nodeUsed[node],
          },
        ];
        return acc;
      }, {}),
    };
  }, [poolsData]);

  useEffect(() => {
    if (isLoading || chartData.categories.length === 0) {
      setHoverableNodes([]);
      return;
    }

    const updateHoverableNodes = () => {
      setHoverableNodes(buildHoveredNodes(chartContainerRef.current, chartData.categories, chartData.nodeSummaries));
    };

    const timer = window.setTimeout(updateHoverableNodes, 0);
    window.addEventListener('resize', updateHoverableNodes);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateHoverableNodes);
    };
  }, [chartData.categories, chartData.nodeSummaries, height, isLoading]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const handleMouseOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const legendItem = target?.closest('.apexcharts-legend-series') as HTMLElement | null;
      if (!legendItem) {
        return;
      }

      const relatedTarget = (event as MouseEvent).relatedTarget as Node | null;
      if (relatedTarget && legendItem.contains(relatedTarget)) {
        return;
      }

      const legendItems = Array.from(container.querySelectorAll('.apexcharts-legend-series'));
      const seriesIndex = legendItems.indexOf(legendItem);
      if (seriesIndex === -1) {
        return;
      }

      requestAnimationFrame(() => {
        setHoveredSeriesState(container, seriesIndex, true);
        legendItem.classList.add(HOVERED_LEGEND_CLASS);
      });
    };

    const handleMouseOut = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const legendItem = target?.closest('.apexcharts-legend-series') as HTMLElement | null;
      if (!legendItem) {
        return;
      }

      const relatedTarget = (event as MouseEvent).relatedTarget as Node | null;
      if (relatedTarget && legendItem.contains(relatedTarget)) {
        return;
      }

      const legendItems = Array.from(container.querySelectorAll('.apexcharts-legend-series'));
      const seriesIndex = legendItems.indexOf(legendItem);
      if (seriesIndex === -1) {
        return;
      }

      requestAnimationFrame(() => {
        setHoveredSeriesState(container, seriesIndex, false);
        legendItem.classList.remove(HOVERED_LEGEND_CLASS);
      });
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);
    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [chartData.series, height, isLoading]);

  const options: ApexOptions = {
    chart: {
      stacked: true,
      toolbar: {
        show: false,
      },
      events: {
        dataPointMouseEnter: (_event, chartContext, config) => {
          clearHoveredNodeTimer();
          setHoveredSegmentState(chartContext, config.seriesIndex, config.dataPointIndex, true);
          setHoveredLegendGroupState(chartContainerRef.current, chartData.series, config.seriesIndex, true);
        },
        dataPointMouseLeave: (_event, chartContext, config) => {
          setHoveredSegmentState(chartContext, config.seriesIndex, config.dataPointIndex, false);
          setHoveredLegendGroupState(chartContainerRef.current, chartData.series, config.seriesIndex, false);
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
        <ChartContainer enableScroll={nodeCount >= 5} ref={chartContainerRef}>
          {hoveredNode && (
            <>
              <div
                className="storage-pool-node-overlay"
                style={{
                  left: hoveredNode.left,
                  top: hoveredNode.top,
                  width: hoveredNode.width,
                  height: hoveredNode.height,
                }}
              />
              <div
                className="storage-pool-node-tooltip"
                onMouseEnter={clearHoveredNodeTimer}
                onMouseLeave={scheduleHoveredNodeClear}
                style={{
                  left: Math.max(hoveredNode.left + hoveredNode.width / 2 - NODE_TOOLTIP_WIDTH / 2, 0),
                  top: hoveredNode.top + 28,
                }}
              >
                <div className="storage-pool-node-tooltip-header">
                  <div>SP Name</div>
                  <div>Node Free</div>
                  <div>Node Used</div>
                </div>
                <div className="storage-pool-node-tooltip-body">
                  {hoveredNode.details.map((item) => (
                    <div className="storage-pool-node-tooltip-row" key={`${hoveredNode.name}-${item.label}`}>
                      <div className="storage-pool-node-tooltip-label">{item.label}</div>
                      <div className="storage-pool-node-tooltip-metric">{formatBytes(item.free)}</div>
                      <div className="storage-pool-node-tooltip-metric">{formatBytes(item.used)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {hoverableNodes.map((node) => (
            <div
              className="storage-pool-node-hover-zone"
              key={`hover-zone-${node.name}`}
              onMouseEnter={() => activateHoveredNode(node)}
              onMouseLeave={scheduleHoveredNodeClear}
              style={{
                left: node.triggerLeft,
                top: node.triggerTop,
                width: node.triggerWidth,
                height: node.triggerHeight,
              }}
            />
          ))}
          <Chart
            options={options}
            series={chartData.series}
            type="bar"
            height={height > 900 ? 500 : 300}
            {...widthForChart}
          />
        </ChartContainer>
      </Spin>
    </div>
  );
};
