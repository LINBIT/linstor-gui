// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useEffect, useId, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton, Table } from 'antd';
import type { TableProps } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { formatTime } from '@app/utils/time';
import { generateUUID } from '@app/utils/stringUtils';
import { ResourceDataType } from '../types';
import { getResourceState, Resource, getFaultyVolumeNumbers } from '@app/utils/resource';
import { useFaultyResources } from '../hooks/useFaultyResources';
import { isFocusFaulty } from '../faultyFocus';
import { Link } from '@app/components/Link';

export const FaultyList = () => {
  const { t } = useTranslation(['common', 'resource']);

  const { data: resources, isLoading } = useFaultyResources();

  // The header's faulty-resource icon sends you here: scroll the list into view
  // once it has its height, and again on every click (each one is a new location).
  const location = useLocation();
  const focused = isFocusFaulty(location.state);
  const sectionRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (focused && !isLoading) sectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [focused, isLoading, location.key]);

  const handleConnectStatusDisplay = (resourceItem: ResourceDataType) => {
    let failStr = '';
    const conn = resourceItem?.layer_object?.drbd?.connections ?? {};
    if (Object.keys(conn).length === 0) {
      return 'OK';
    }
    let count = 0;
    let fail = false;
    for (const nodeName in conn) {
      count++;
      if (!conn?.[nodeName]?.connected) {
        fail = true;
        if (failStr !== '') {
          failStr += ',';
        }
        failStr += `${nodeName} ${conn?.[nodeName]?.message}`;
      }
    }
    fail = count === 0 ? true : fail;
    failStr = fail ? failStr : 'OK';
    return failStr;
  };

  const columns: TableProps<ResourceDataType>['columns'] = [
    {
      title: t('common:name'),
      key: 'name',
      dataIndex: 'name',
      render: (item) => {
        return <Link to={`/storage-configuration/resource-overview?resource=${item}`}>{item}</Link>;
      },
    },
    {
      title: t('common:node'),
      key: 'node_name',
      dataIndex: 'node_name',
      render: (node_name) => {
        return <Link to={`/inventory/nodes/${node_name}`}>{node_name}</Link>;
      },
    },
    {
      title: t('common:volume_number_short'),
      key: 'volume_number',
      render: (_, item) => {
        const faultyVolumes = getFaultyVolumeNumbers(item as Resource);
        return <span>{faultyVolumes.length > 0 ? faultyVolumes.join(', ') : '-'}</span>;
      },
    },
    {
      title: t('common:created_on'),
      key: 'create_timestamp',
      dataIndex: 'create_timestamp',
      render: (create_timestamp) => {
        return <span>{formatTime(create_timestamp)}</span>;
      },
    },
    {
      title: t('common:usage_status'),
      key: 'in_use',
      dataIndex: 'in_use',
      align: 'center',
      render: (_, item) => {
        const in_use = item.state?.in_use;
        const usage = in_use ? 'InUse' : 'Unused';
        return (
          <span>
            {in_use ? (
              <span className="text-(--icon-success)">
                <CheckCircleFilled className="text-[16px]" />
              </span>
            ) : (
              <span className="text-(--icon-muted)">
                <CloseCircleFilled className="text-[16px]" />
              </span>
            )}
            <span className="ml-2">{usage}</span>
          </span>
        );
      },
    },
    {
      title: t('common:connection_status'),
      key: 'connection_status',
      align: 'center',
      render: (_, item) => {
        return <span>{handleConnectStatusDisplay(item)}</span>;
      },
    },
    {
      title: t('common:state'),
      key: 'state',
      align: 'center',
      render: (_, item) => {
        return <span>{getResourceState(item as Resource)}</span>;
      },
    },
  ];

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      // Clear of the sticky 72px header, with the page's own 24px gap above it.
      className="border-2 border-[color:var(--border-subtle)] rounded px-[34px] py-[30px] mt-[20px] scroll-mt-[96px]"
    >
      <h2 id={titleId} className="m-0 mb-4 text-[26px] font-semibold">
        {t('common:faulty_resource')}
      </h2>
      {/* "All healthy" only once the resources are known to be. */}
      {isLoading ? (
        <Skeleton active title={false} paragraph={{ rows: 3 }} />
      ) : resources?.length ? (
        <Table<ResourceDataType>
          columns={columns}
          dataSource={(resources as ResourceDataType[]) ?? []}
          pagination={false}
          rowKey={(item) => item?.uuid || generateUUID()}
        />
      ) : (
        <div className="mt-[20px] text-[var(--text-muted)]">{t('common:all_resources_are_healthy')}</div>
      )}
    </section>
  );
};
