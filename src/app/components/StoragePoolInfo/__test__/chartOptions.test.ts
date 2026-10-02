// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { buildChartOptions } from '../chartOptions';

describe('buildChartOptions', () => {
  it('is a stacked bar chart over the given nodes without apex legend or toolbar', () => {
    const options = buildChartOptions('light', ['n1', 'n2'], vi.fn());
    expect(options.chart?.stacked).toBe(true);
    expect(options.chart?.toolbar?.show).toBe(false);
    expect(options.legend?.show).toBe(false);
    expect(options.xaxis?.categories).toEqual(['n1', 'n2']);
  });

  it.each([
    ['light', '#373d3f', '#fff', '#e0e0e0'],
    ['dark', '#e0e0e0', '#111111', '#2e2e2e'],
  ] as const)('follows the %s theme', (mode, text, separator, grid) => {
    const options = buildChartOptions(mode, [], vi.fn());
    expect(options.chart?.foreColor).toBe(text);
    expect(options.stroke?.colors).toEqual([separator]);
    expect(options.grid?.borderColor).toBe(grid);
    expect(options.tooltip?.theme).toBe(mode);
  });

  it('reports a segment the pointer enters and marks it until the pointer leaves', () => {
    const onSegmentEnter = vi.fn();
    const options = buildChartOptions('light', ['n1'], onSegmentEnter);
    const root = document.createElement('div');
    // The handlers only read the chart instance's root element.
    const chart = { el: root } as never;
    root.innerHTML =
      '<div class="apexcharts-bar-series"><g class="apexcharts-series" data:realIndex="0"><path></path><path></path></g></div>';
    const segment = root.querySelectorAll('path')[1];
    // The handlers only read the series and data point of the event options.
    const config = { seriesIndex: 0, dataPointIndex: 1 } as never;

    options.chart?.events?.dataPointMouseEnter?.(new MouseEvent('mouseenter'), chart, config);
    expect(onSegmentEnter).toHaveBeenCalledTimes(1);
    expect(segment).toHaveClass('storage-pool-hovered-segment');

    options.chart?.events?.dataPointMouseLeave?.(new MouseEvent('mouseleave'), chart, config);
    expect(segment).not.toHaveClass('storage-pool-hovered-segment');
  });
});
