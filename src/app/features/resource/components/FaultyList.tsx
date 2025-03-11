// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import { formatTime } from '@app/utils/time';
import { getResources } from '../api';
import { ResourceDataType } from '../types';
import { getFaultyResources, getResourceState } from '@app/utils/resource';

const Content = styled.div`
  margin-top: 20px;
`;

const EmptyContent = styled.div`
  margin-top: 20px;
  color: #999;
`;

export const FaultyList = () => {
  const { t } = useTranslation(['common', 'resource']);

  const history = useHistory();

  const { data: resources, isLoading } = useQuery({
    queryKey: ['getResources'],
    queryFn: async () => {
      const all = await getResources();
      const faulty = getFaultyResources(all?.data ?? ([] as any));

      console.log('faulty', faulty);

      return faulty;
    },
  });

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
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/storage-configuration/resource-overview?resource=${item}`);
            }}
          >
            {item}
          </Button>
        );
      },
    },
    {
      title: t('common:node'),
      key: 'node_name',
      dataIndex: 'node_name',
      render: (node_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/inventory/nodes/${node_name}`);
            }}
          >
            {node_name}
          </Button>
        );
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
      title: t('common:port'),
      key: 'port',
      render: (item) => {
        return <span>{item?.layer_object?.drbd?.drbd_resource_definition?.port}</span>;
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
        return <span>{getResourceState(item as any)}</span>;
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Content>
      <h3>{t('common:faulty_resource')}</h3>
      {resources?.length ? (
        <Table columns={columns as any} dataSource={resources ?? []} pagination={false} />
      ) : (
        <EmptyContent>{t('common:all_resources_are_healthy')}</EmptyContent>
      )}
    </Content>
  );
};
