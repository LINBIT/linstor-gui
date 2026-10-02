// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { formatBytes } from '@app/utils/size';
import { formatLegendLabel } from './chartData';
import type { SeriesItem } from './types';

type ChartLegendProps = {
  series: SeriesItem[];
  seriesTotals: number[];
  highlightedLegendIndexes: number[];
  onItemEnter: (index: number) => void;
  onItemLeave: (index: number) => void;
};

/** The legend under the chart: each series with its total over the nodes. */
export const ChartLegend = ({
  series,
  seriesTotals,
  highlightedLegendIndexes,
  onItemEnter,
  onItemLeave,
}: ChartLegendProps) => (
  <div className="storage-pool-custom-legend">
    {series.map((seriesItem, index) => (
      <div
        className={`storage-pool-custom-legend-item${highlightedLegendIndexes.includes(index) ? ' is-highlighted' : ''}`}
        key={`${seriesItem.name}-${index}`}
        onMouseEnter={() => onItemEnter(index)}
        onMouseLeave={() => onItemLeave(index)}
      >
        <span className="storage-pool-custom-legend-marker" style={{ background: seriesItem.color }} />
        <span>{formatLegendLabel(seriesItem.name)}</span>
        <span className="storage-pool-custom-legend-value">{formatBytes(seriesTotals[index])}</span>
      </div>
    ))}
  </div>
);
