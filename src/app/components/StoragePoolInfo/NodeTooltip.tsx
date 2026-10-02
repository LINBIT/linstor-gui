// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { formatBytes } from '@app/utils/size';
import type { ChartItem, HoveredNode, NodeSummaryItem } from './types';

type NodeTooltipProps = {
  hoveredNode: HoveredNode;
  /** The node's rows: its pools first, then the node total. */
  rows: NodeSummaryItem[];
  tooltipPanelHeight: number;
  /** The series the pointer is on, whose metric is highlighted. */
  hoveredChartItem: ChartItem | null;
  onTooltipEnter: () => void;
  onTooltipLeave: () => void;
  /** The pointer entered a pool's free or used figure. */
  onMetricEnter: (group: string, side: 'free' | 'used') => void;
};

/** The hovered node's overlay: free and used space per pool and in total. */
export const NodeTooltip = ({
  hoveredNode,
  rows,
  tooltipPanelHeight,
  hoveredChartItem,
  onTooltipEnter,
  onTooltipLeave,
  onMetricEnter,
}: NodeTooltipProps) => (
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
      onMouseEnter={onTooltipEnter}
      onMouseLeave={onTooltipLeave}
    >
      <div className="storage-pool-node-tooltip-content">
        {rows.map((item) => {
          const isFreeHighlighted = hoveredChartItem?.group === item.group && hoveredChartItem?.side === 'free';
          const isUsedHighlighted = hoveredChartItem?.group === item.group && hoveredChartItem?.side === 'used';
          return (
            <div className="storage-pool-node-tooltip-row" key={`${hoveredNode.name}-${item.label}`}>
              <div className="storage-pool-node-tooltip-label">{item.label}</div>
              <div
                className={`storage-pool-node-tooltip-metric${isFreeHighlighted ? ' is-highlighted' : ''}`}
                onMouseEnter={() => onMetricEnter(item.group, 'free')}
              >
                {item.freeColor && (
                  <span className="storage-pool-node-tooltip-metric-dot" style={{ background: item.freeColor }} />
                )}
                {`Free: ${formatBytes(item.free)}`}
              </div>
              <div
                className={`storage-pool-node-tooltip-metric${isUsedHighlighted ? ' is-highlighted' : ''}`}
                onMouseEnter={() => onMetricEnter(item.group, 'used')}
              >
                {item.usedColor && (
                  <span className="storage-pool-node-tooltip-metric-dot" style={{ background: item.usedColor }} />
                )}
                {`Used: ${formatBytes(item.used)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
