import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { deleteResourceGroup, getResourceGroups } from '../api';

import { Button, Popconfirm, Space, Table } from 'antd';
import type { TableProps } from 'antd';
import { REFETCH_INTERVAL } from '@app/const/time';
import { DEFAULT_SP } from '@app/const/type';
import { CreateResourceGroup } from './CreateResourceGroup';
import { notify } from '@app/utils/toast';

interface DataType {
  name: string;
  select_filter: {
    place_count: number;
    storage_pool: string;
  };
}

export const ResourceGroupList = () => {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['getResourceGroups'],
    queryFn: () => getResourceGroups(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResourceGroup,
    onSuccess: () => {
      notify('Delete resource group successfully', {
        type: 'success',
      });
      refetch();
    },
    onError: (err) => {
      console.log(err);
      notify('Delete resource group failed', {
        type: 'error',
      });
    },
  });

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Storage Pool',
      dataIndex: 'select_filter',
      key: 'storage_pool',
      render: (select_filter) => {
        return <div>{select_filter.storage_pool}</div>;
      },
    },
    {
      title: 'Replica Count',
      dataIndex: 'select_filter',
      key: 'place_count',
      render: (select_filter) => {
        return <div>{select_filter.place_count}</div>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        return (
          <Popconfirm
            key="delete"
            title="Delete the error report"
            description="Are you sure to delete this error report?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              deleteMutation.mutate(record.name);
            }}
          >
            <Button type="default" danger>
              Delete
            </Button>
          </Popconfirm>
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

        <CreateResourceGroup />
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
