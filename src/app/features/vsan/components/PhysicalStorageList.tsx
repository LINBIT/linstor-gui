import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getPhysicalStorage, getStoragePool } from '../api';

import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { REFETCH_INTERVAL } from '@app/const/time';
import { formatBytes } from '@app/utils/size';
import { DEFAULT_SP } from '@app/const/type';
import Create from '@app/pages/SoftwareDefined/ResourceDefinitions/create';
import { CreateResourceGroupFrom } from '@app/features/resourceGroup';

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
                  {node}: {formatBytes(capacities[node])} &nbsp;
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
      <div style={{ marginBottom: 10 }}>
        <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
          Reload
        </Button>
      </div>
      <Table
        bordered={false}
        columns={columns}
        dataSource={data?.data?.filter((item) => item.name !== DEFAULT_SP) ?? []}
        loading={isLoading}
      />
    </div>
  );
};
