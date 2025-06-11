// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

import { formatTime } from '@app/utils/time';
import { ResourceDataType } from '../types';
import { getResourceState } from '@app/utils/resource';
import { useFaultyResources } from '../hooks/useFaultyResources';

const Content = styled.div`
  margin-top: 20px;
`;

const EmptyContent = styled.div`
  margin-top: 20px;
  color: #999;
`;

export const FaultyList = () => {
  const { t } = useTranslation(['common', 'resource']);

  const navigate = useNavigate();

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
        return (
          <Button
            type="link"
            onClick={() => {
              navigate(`/storage-configuration/resource-overview?resource=${item}`);
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
              navigate(`/inventory/nodes/${node_name}`);
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

  return (
    <Content>
      <h3 className="font-semibold text-[16px]">{t('common:faulty_resource')}</h3>
      {resources?.length ? (
        <Table columns={columns as any} dataSource={resources ?? []} pagination={false} loading={isLoading} />
      ) : (
        <EmptyContent>{t('common:all_resources_are_healthy')}</EmptyContent>
      )}
    </Content>
  );
};
