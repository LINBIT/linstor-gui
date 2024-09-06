// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { getStoragePool } from '../api';

import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { REFETCH_INTERVAL } from '@app/const/time';
import { formatBytes } from '@app/utils/size';
import { DEFAULT_SP } from '@app/const/type';
import { CreateStoragePoolForm } from '@app/features/vsan';
import { ActionSection } from './styled';

interface DataType {
  name: string;
  providerKind: string;
  capacities: {
    [node: string]: number;
  };
}

export const PhysicalStorageList = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const handleExpand = (expanded, record) => {
    setExpandedRowKeys(expanded ? [record.name] : []);
  };

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'providerKind',
      key: 'providerKind',
    },
    Table.EXPAND_COLUMN,
    {
      title: 'Deployed on Nodes',
      dataIndex: 'capacities',
      key: 'capacities',
      render: (capacities) => {
        const nodes = Object.keys(capacities);
        return (
          <div>
            {nodes.map((node) => {
              return (
                <span key={node}>
                  {node}: {formatBytes(capacities[node])} &nbsp; &nbsp;
                </span>
              );
            })}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <ActionSection>
        <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
          Reload
        </Button>

        <CreateStoragePoolForm refetch={refetch} />
      </ActionSection>

      <Table
        bordered={false}
        columns={columns}
        dataSource={data?.data?.filter((item) => item.name !== DEFAULT_SP) ?? []}
        loading={isLoading}
        expandable={{
          expandedRowRender: (record) => {
            const nodes = Object.keys(record?.capacities) ?? [];
            return (
              <div style={{ margin: 0 }}>
                {nodes.map((node) => {
                  return (
                    <div key={node}>
                      {node}: {formatBytes(record?.capacities[node])}
                    </div>
                  );
                })}
              </div>
            );
          },
          expandRowByClick: true,
          expandedRowKeys,
          onExpand: handleExpand,
        }}
        pagination={false}
        rowKey="name"
      />
    </div>
  );
};
