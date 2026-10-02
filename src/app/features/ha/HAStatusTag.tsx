// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Tag, Tooltip } from 'antd';
import type { PromoterEntry, ReactorStatus } from './haStatus';
import { ACTIVE_TAG_STYLE, PROMOTER_TOOLTIP_STYLES, renderPromoterTree } from './PromoterTree';

interface HAStatusTagProps {
  resourceName: string;
  active: boolean;
  reactorStatus?: ReactorStatus;
}

/** Running/Stopped, with the active promoter's service tree as tooltip. */
export const HAStatusTag: React.FC<HAStatusTagProps> = ({ resourceName, active, reactorStatus }) => {
  // Collect only the active promoter's info
  const activePromoter = reactorStatus
    ? Object.entries(reactorStatus).flatMap(([nodeName, nodeStatus]) =>
        (nodeStatus.promoter ?? [])
          .filter((p) => p.drbd_resource === resourceName && p.status === 'active')
          .map((p) => ({ nodeName, promoter: p })),
      )[0]
    : null;

  const tooltipContent = activePromoter
    ? renderPromoterTree(
        activePromoter.promoter as PromoterEntry,
        resourceName,
        activePromoter.nodeName === 'this node' ? 'this node' : `node '${activePromoter.nodeName}'`,
      )
    : null;

  const tag = (
    <Tag color={active ? undefined : 'default'} style={active ? ACTIVE_TAG_STYLE : undefined}>
      {active ? 'Running' : 'Stopped'}
    </Tag>
  );

  return tooltipContent ? (
    <Tooltip title={tooltipContent} styles={PROMOTER_TOOLTIP_STYLES}>
      {tag}
    </Tooltip>
  ) : (
    tag
  );
};
