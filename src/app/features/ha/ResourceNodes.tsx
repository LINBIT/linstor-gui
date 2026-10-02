// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Tag, Space, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { Link } from '@app/components/Link';
import { useResources } from './useHA';
import type { PromoterEntry } from './haStatus';
import { ACTIVE_NODE_LINK_STYLE, ACTIVE_TAG_STYLE, PROMOTER_TOOLTIP_STYLES, renderPromoterTree } from './PromoterTree';

interface ResourceNodesProps {
  resourceName: string;
  reactorStatus?: Record<string, { promoter?: Array<{ drbd_resource: string; primary_on: string; status: string }> }>;
}

export const ResourceNodes: React.FC<ResourceNodesProps> = ({ resourceName, reactorStatus }) => {
  const { data: resourcesView, isLoading } = useResources(resourceName);

  if (isLoading) {
    return <LoadingOutlined spin style={{ color: 'rgba(0, 0, 0, 0.45)' }} />;
  }

  const resourceNodes =
    (resourcesView?.data as Array<{
      name: string;
      node_name: string;
      state?: { in_use?: boolean };
    }>) || [];

  if (resourceNodes.length === 0) {
    return <span>-</span>;
  }

  // Find primary node from reactor status
  let primaryNodeFromReactor: string | null = null;
  if (reactorStatus) {
    for (const nodeStatus of Object.values(reactorStatus)) {
      const promoter = nodeStatus.promoter?.find((p) => p.drbd_resource === resourceName);
      if (promoter && promoter.status === 'active') {
        primaryNodeFromReactor = promoter.primary_on;
        break;
      }
    }
  }

  return (
    <Space size="small" wrap>
      {resourceNodes.map((resourceObj) => {
        // Once DRBD Reactor status is available, treat it as the source of truth.
        // Falling back to resources-view in_use after HA actions keeps showing stale primary nodes.
        const isPrimary =
          reactorStatus !== undefined
            ? resourceObj.node_name === primaryNodeFromReactor
            : !!resourceObj.state && resourceObj.state.in_use === true;

        // Find this node's promoter info from reactor status
        const nodePromoter = reactorStatus
          ? Object.entries(reactorStatus)
              .flatMap(([nodeName, nodeStatus]) =>
                (nodeStatus.promoter ?? [])
                  .filter((p) => p.drbd_resource === resourceName)
                  .map((p) => ({ nodeName, promoter: p })),
              )
              .find((item) => item.nodeName === resourceObj.node_name)
          : null;

        const nodeTooltipContent = nodePromoter
          ? renderPromoterTree(
              nodePromoter.promoter as PromoterEntry,
              resourceName,
              `node '${nodePromoter.promoter.primary_on}'`,
              nodePromoter.promoter.primary_on === nodePromoter.nodeName
                ? 'this node'
                : `node '${nodePromoter.nodeName}'`,
            )
          : null;

        // Highlight the active/primary node with the LINBIT brand color (same as
        // the "+ Add" button) instead of the default green success tag.
        const tag = (
          <Tag
            color={isPrimary ? undefined : 'default'}
            key={resourceObj.node_name}
            style={isPrimary ? ACTIVE_TAG_STYLE : undefined}
          >
            {isPrimary ? (
              <Link to={`/inventory/nodes/${resourceObj.node_name}`} style={ACTIVE_NODE_LINK_STYLE}>
                {resourceObj.node_name}
              </Link>
            ) : (
              <Link to={`/inventory/nodes/${resourceObj.node_name}`}>{resourceObj.node_name}</Link>
            )}
          </Tag>
        );

        return (
          <Tooltip title={nodeTooltipContent} key={resourceObj.node_name} styles={PROMOTER_TOOLTIP_STYLES}>
            {tag}
          </Tooltip>
        );
      })}
    </Space>
  );
};
