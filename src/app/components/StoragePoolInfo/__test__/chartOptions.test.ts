// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { themeTokens } from '@app/const/themeTokens';
import { buildChartOptions } from '../chartOptions';

describe('buildChartOptions', () => {
  it('is a stacked bar chart over the given nodes without apex legend or toolbar', () => {
    const options = buildChartOptions('light', ['n1', 'n2'], vi.fn());
    expect(options.chart?.stacked).toBe(true);
    expect(options.chart?.toolbar?.show).toBe(false);
    expect(options.legend?.show).toBe(false);
    expect(options.xaxis?.categories).toEqual(['n1', 'n2']);
  });

  // apex can't read CSS variables, so the options carry the tokens' values.
  it.each(['light', 'dark'] as const)('follows the %s theme', (mode) => {
    const options = buildChartOptions(mode, [], vi.fn());
    expect(options.chart?.foreColor).toBe(themeTokens['text/secondary'][mode]);
    expect(options.stroke?.colors).toEqual([themeTokens['bg/page'][mode]]);
    expect(options.grid?.borderColor).toBe(themeTokens['border/subtle'][mode]);
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
