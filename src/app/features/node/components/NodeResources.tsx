// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Empty, Table, Tag, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';

import { Link } from '@app/components/Link';
import { getResourceState } from '@app/utils/resource';
import type { ResourceDataType } from '@app/features/resource/types';

interface NodeResourcesProps {
  resources: ResourceDataType[];
  /** Prefix of the resource overview route ('' or '/hci'). */
  routePrefix?: string;
}

/** A value per volume, once each (a resource's volumes usually share a pool). */
const perVolume = (
  r: ResourceDataType,
  pick: (v: NonNullable<ResourceDataType['volumes']>[number]) => string | undefined,
) => Array.from(new Set((r.volumes ?? []).map(pick).filter(Boolean))).join(', ');

const isDiskless = (r: ResourceDataType) => !!r.flags?.some((f) => f === 'DISKLESS' || f === 'DRBD_DISKLESS');

const Count: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="min-w-[96px]">
    <div className="text-2xl font-semibold tabular-nums">{value}</div>
    <div className="text-(--text-secondary)">{label}</div>
  </div>
);

/** The resources deployed on the node: how many and in which role, then each one. */
export const NodeResources: React.FC<NodeResourcesProps> = ({ resources, routePrefix = '' }) => {
  const { t } = useTranslation(['node_detail', 'common', 'resource', 'volume']);

  if (resources.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('node_detail:no_resources')} />;
  }

  const primary = resources.filter((r) => r.state?.in_use).length;
  const diskless = resources.filter(isDiskless).length;

  const columns: TableProps<ResourceDataType>['columns'] = [
    {
      title: t('common:name'),
      key: 'name',
      dataIndex: 'name',
      sorter: (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
      defaultSortOrder: 'ascend',
      showSorterTooltip: false,
      render: (name: string) => (
        <Link to={`${routePrefix}/storage-configuration/resource-overview?resource=${encodeURIComponent(name)}`}>
          {name}
        </Link>
      ),
    },
    {
      title: t('common:storage_pool'),
      key: 'storage_pool',
      render: (_, r) => perVolume(r, (v) => v.storage_pool_name),
    },
    {
      title: t('volume:device_name'),
      key: 'device',
      render: (_, r) => <span className="tabular-nums">{perVolume(r, (v) => v.device_path)}</span>,
    },
    {
      title: t('common:state'),
      key: 'state',
      render: (_, r) => {
        const state = getResourceState(r);
        const isPrimary = r.state?.in_use === true;
        return (
          <span className="inline-flex flex-wrap gap-y-1">
            <Tag color={state.includes('Inconsistent') ? 'red' : 'geekblue'}>{state}</Tag>
            {isPrimary && <Tag color="cyan">{t('common:primary')}</Tag>}
            {!isPrimary && r.state?.open === true && (
              <Tooltip title={t('resource:open_tooltip')}>
                <Tag color="gold">{t('resource:open')}</Tag>
              </Tooltip>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-x-8 gap-y-3">
        <Count label={t('common:resources')} value={resources.length} />
        <Count label={t('common:primary')} value={primary} />
        <Count label={t('node_detail:diskful')} value={resources.length - diskless} />
        <Count label={t('node_detail:diskless')} value={diskless} />
      </div>
      <Table<ResourceDataType>
        size="small"
        columns={columns}
        dataSource={resources}
        rowKey={(r) => r.name ?? ''}
        pagination={resources.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
      />
    </>
  );
};
