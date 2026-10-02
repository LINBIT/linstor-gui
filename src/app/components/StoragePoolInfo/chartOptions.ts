// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { ApexOptions } from 'apexcharts';
import type { ThemeMode } from '@app/const/themeTokens';
import { formatBytes } from '@app/utils/size';
import { setHoveredSegmentState } from './chartDom';

/** The stacked bar chart's options; `onSegmentEnter` runs when the pointer
 *  enters a bar segment, before the segment is marked hovered. */
export const buildChartOptions = (mode: ThemeMode, categories: string[], onSegmentEnter: () => void): ApexOptions => ({
  chart: {
    // Axis/label text follows the theme (apex can't read CSS vars)
    foreColor: mode === 'dark' ? '#e0e0e0' : '#373d3f',
    stacked: true,
    redrawOnParentResize: true,
    redrawOnWindowResize: true,
    toolbar: {
      show: false,
    },
    events: {
      dataPointMouseEnter: (_event, chartContext, config) => {
        onSegmentEnter();
        if (config) setHoveredSegmentState(chartContext, config.seriesIndex, config.dataPointIndex, true);
      },
      dataPointMouseLeave: (_event, chartContext, config) => {
        if (config) setHoveredSegmentState(chartContext, config.seriesIndex, config.dataPointIndex, false);
      },
    },
  },
  states: {
    hover: {
      filter: {
        type: 'none',
      },
    },
    active: {
      filter: {
        type: 'none',
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
    categories,
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
    // Segment separator matches the page background in each mode
    colors: [mode === 'dark' ? '#111111' : '#fff'],
  },
  grid: {
    borderColor: mode === 'dark' ? '#2e2e2e' : '#e0e0e0',
  },
  tooltip: {
    theme: mode,
  },
});
