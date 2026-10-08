// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Card, Descriptions, Popover, Tag } from 'antd';
import type { DescriptionsProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { FaLinux, FaWindows } from 'react-icons/fa';

import { SupportStatus } from '@app/components/SupportStatus';
import type { NodeDataType } from '../types';

interface NodeSummaryProps {
  node?: NodeDataType;
  /** The controller reports the platform from REST API 1.28.0 on. */
  showPlatform: boolean;
}

/**
 * What the satellite offers: the supported names plainly, the unsupported
 * ones behind a count whose popover gives the satellite's reason for each.
 */
const Capabilities: React.FC<{ label: string; supported?: string[]; unsupported?: Record<string, string[]> }> = ({
  label,
  supported = [],
  unsupported = {},
}) => {
  const { t } = useTranslation('node_detail');
  const missing = Object.entries(unsupported);

  return (
    <div className="flex flex-wrap items-baseline gap-y-1">
      <span className="mr-3 font-semibold">{label}</span>
      {supported.map((name) => (
        <Tag key={name}>{name}</Tag>
      ))}
      {missing.length > 0 && (
        <Popover
          title={t('unsupported_hint')}
          content={
            <ul className="m-0 max-w-[480px] list-none p-0">
              {missing.map(([name, reasons]) => (
                <li key={name} className="py-0.5">
                  <span className="font-semibold">{name}</span>
                  {reasons.length > 0 && <span className="text-(--text-secondary)">: {reasons.join('; ')}</span>}
                </li>
              ))}
            </ul>
          }
        >
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-(--text-link) underline decoration-dotted underline-offset-4"
          >
            {t('unsupported_count', { count: missing.length })}
          </button>
        </Popover>
      )}
    </div>
  );
};

/** The node at a glance: name and state first, then where it runs and what it can do. */
export const NodeSummary: React.FC<NodeSummaryProps> = ({ node, showPlatform }) => {
  const { t } = useTranslation(['node_detail', 'common']);
  const online = node?.connection_status === 'ONLINE' || node?.connection_status === 'CONNECTED';
  const active = node?.net_interfaces?.find((ni) => ni.is_active) ?? node?.net_interfaces?.[0];

  const items: DescriptionsProps['items'] = [
    {
      key: 'type',
      label: t('node_detail:node_type'),
      children: node?.type ? node.type.charAt(0) + node.type.slice(1).toLowerCase() : '-',
    },
    ...(showPlatform
      ? [
          {
            key: 'platform',
            label: t('node_detail:platform'),
            children: (
              <span className="inline-flex items-center gap-1.5">
                {node?.platform === 'LINUX' && <FaLinux aria-hidden />}
                {node?.platform === 'WINDOWS' && <FaWindows aria-hidden />}
                {node?.platform ? node.platform.charAt(0) + node.platform.slice(1).toLowerCase() : '-'}
              </span>
            ),
          },
        ]
      : []),
    { key: 'os', label: t('node_detail:os_variant'), children: node?.os_variant || '-' },
    {
      key: 'address',
      label: t('node_detail:address'),
      children: active ? (
        <span className="tabular-nums">
          {active.address}
          {active.satellite_port ? `:${active.satellite_port}` : ''}
          {active.satellite_encryption_type && (
            <span className="ml-2 text-(--text-secondary)">{active.satellite_encryption_type}</span>
          )}
        </span>
      ) : (
        '-'
      ),
    },
  ];

  return (
    <Card size="small">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-xl font-semibold">{node?.name}</h2>
        {node?.connection_status && (
          <span className="inline-flex items-center gap-1.5">
            <SupportStatus supported={online} />
            <span>{node.connection_status.charAt(0) + node.connection_status.slice(1).toLowerCase()}</span>
          </span>
        )}
        {node?.flags?.map((flag) => (
          <Tag key={flag} color="warning">
            {flag}
          </Tag>
        ))}
      </div>

      <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }} items={items} />

      {node && (
        <div className="mt-2 flex flex-col gap-1">
          <Capabilities
            label={t('node_detail:resource_layers')}
            supported={node.resource_layers}
            unsupported={node.unsupported_layers}
          />
          <Capabilities
            label={t('node_detail:storage_providers')}
            supported={node.storage_providers}
            unsupported={node.unsupported_providers}
          />
        </div>
      )}
    </Card>
  );
};
