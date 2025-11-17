// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Table } from 'antd';
import type { TableProps } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { formatTime } from '@app/utils/time';
import { generateUUID } from '@app/utils/stringUtils';
import { ResourceDataType } from '../types';
import { getResourceState, Resource } from '@app/utils/resource';
import { useFaultyResources } from '../hooks/useFaultyResources';
import { Link } from '@app/components/Link';

export const FaultyList = () => {
  const { t } = useTranslation(['common', 'resource']);

  const { data: resources, isLoading } = useFaultyResources();

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
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}
            <span style={{ marginLeft: 8 }}>{usage}</span>
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
    <div className="border-2 border-gray-200 rounded px-[34px] py-[30px] mt-[20px]">
      <h3 className="m-0 mb-4 text-[26px] font-semibold">{t('common:faulty_resource')}</h3>
      {resources?.length ? (
        <Table<ResourceDataType>
          columns={columns}
          dataSource={(resources as ResourceDataType[]) ?? []}
          pagination={false}
          loading={isLoading}
          rowKey={(item) => item?.uuid || generateUUID()}
        />
      ) : (
        <div className="mt-[20px] text-[#999]">{t('common:all_resources_are_healthy')}</div>
      )}
    </div>
  );
};
