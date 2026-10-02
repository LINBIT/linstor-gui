// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Spin } from 'antd';
import Chart from '@app/components/Chart';
import './index.css';
import { useWindowSize, useThemeMode } from '@app/hooks';
import { NODE_DETAILS_PANEL_GAP, NODE_DETAILS_PANEL_PADDING, NODE_DETAILS_PANEL_ROW_HEIGHT } from './constants';
import { getSeriesIndexByGroupAndSide, hoveredChartItemOf } from './chartData';
import { buildChartOptions } from './chartOptions';
import { useStoragePoolChartData } from './useStoragePoolChartData';
import { useNodeHover } from './useNodeHover';
import { useSeriesHighlight } from './useSeriesHighlight';
import { OverviewHeader } from './OverviewHeader';
import { NodeTooltip } from './NodeTooltip';
import { ChartLegend } from './ChartLegend';

export const StoragePoolInfo: React.FC = () => {
  const { mode } = useThemeMode();
  const { height } = useWindowSize();

  const { chartData, seriesTotals, isPending } = useStoragePoolChartData();
  const {
    chartContainerRef,
    hoveredNode,
    clearHoveredNodeTimer,
    scheduleHoveredNodeClear,
    handleChartContainerMouseMove,
  } = useNodeHover({ categories: chartData.categories, series: chartData.series, height, isPending });
  const {
    highlightedLegendIndexes,
    setHighlightedLegendIndexes,
    highlightedSeriesIndexes,
    setHighlightedSeriesIndexes,
    isBottomLegendHover,
    setIsBottomLegendHover,
  } = useSeriesHighlight({ chartContainerRef, series: chartData.series, hoveredNode });

  const hoveredChartItem = hoveredChartItemOf(chartData.series, highlightedSeriesIndexes);

  const options = buildChartOptions(mode, chartData.categories, clearHoveredNodeTimer);

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

  // Fixed chart height: the node tooltip spacer grows the surrounding container,
  // and ApexCharts' redrawOnParentResize would otherwise redraw (jitter) the chart.
  // Wrapping the chart in a fixed-height parent keeps its observed parent stable.
  const chartHeight = height > 900 ? 500 : 300;

  const highlightSeries = (index: number) => {
    setHighlightedSeriesIndexes([index]);
    setHighlightedLegendIndexes([index]);
  };

  return (
    <div className="border-2 border-[color:var(--border-subtle)] rounded px-[34px] py-[30px]">
      <OverviewHeader nodeCount={nodeCount} totalNodeCount={chartData.totalNodeCount} />
      <Spin spinning={isPending}>
        <div
          className={`storage-pool-chart relative ${nodeCount >= 5 ? 'overflow-x-auto' : 'overflow-x-visible'}${
            isBottomLegendHover ? ' is-legend-hovering' : ''
          }`}
          ref={chartContainerRef}
          onMouseMove={handleChartContainerMouseMove}
          onMouseLeave={scheduleHoveredNodeClear}
        >
          {hoveredNode && (
            <NodeTooltip
              hoveredNode={hoveredNode}
              rows={[...hoveredNodeSpRows, ...(hoveredNodeTotalRow ? [hoveredNodeTotalRow] : [])]}
              tooltipPanelHeight={tooltipPanelHeight}
              hoveredChartItem={hoveredChartItem}
              onTooltipEnter={clearHoveredNodeTimer}
              onTooltipLeave={() => {
                setHighlightedSeriesIndexes([]);
                setHighlightedLegendIndexes([]);
                scheduleHoveredNodeClear();
              }}
              onMetricEnter={(group, side) => {
                const idx = getSeriesIndexByGroupAndSide(chartData.series, group, side);
                if (idx >= 0) {
                  highlightSeries(idx);
                }
              }}
            />
          )}
          <div style={{ height: chartHeight, ...widthForChart }}>
            <Chart options={options} series={chartData.series} type="bar" height={chartHeight} {...widthForChart} />
          </div>
          {hoveredNode && (
            <div
              className="storage-pool-node-details-spacer"
              style={{ height: tooltipPanelHeight + NODE_DETAILS_PANEL_GAP }}
            />
          )}
          <ChartLegend
            series={chartData.series}
            seriesTotals={seriesTotals}
            highlightedLegendIndexes={highlightedLegendIndexes}
            onItemEnter={(index) => {
              setIsBottomLegendHover(true);
              highlightSeries(index);
            }}
            onItemLeave={(index) => {
              setIsBottomLegendHover(false);
              setHighlightedSeriesIndexes((current) => (current.length === 1 && current[0] === index ? [] : current));
              setHighlightedLegendIndexes((current) => (current.length === 1 && current[0] === index ? [] : current));
            }}
          />
        </div>
      </Spin>
    </div>
  );
};
