import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { deleteResourceGroup, getResourceGroups } from '../api';

import { Button, Popconfirm, Table, notification } from 'antd';
import type { TableProps } from 'antd';
import { REFETCH_INTERVAL } from '@app/const/time';
import { DEFAULT_SP } from '@app/const/type';
import { CreateResourceGroup } from './CreateResourceGroup';
import { ErrorMessage } from '@app/features/vsan';
import { ActionSection } from "./styled";

interface DataType {
  name: string;
  select_filter: {
    place_count: number;
    storage_pool: string;
  };
}

export const ResourceGroupList = () => {
  const [api, contextHolder] = notification.useNotification();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['getResourceGroups'],
    queryFn: () => getResourceGroups(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResourceGroup,
    onSuccess: () => {
      api.success({
        message: 'Delete resource group successfully',
      });
      refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail || err?.explanation,
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
            title="Delete the resource group"
            description="Are you sure to delete this resource group?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              deleteMutation.mutate(record.name);
            }}
          >
            <Button type="default" danger loading={deleteMutation.isLoading}>
              Delete
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <ActionSection>
        <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
          Reload
        </Button>

        <CreateResourceGroup />
      </ActionSection>
      <Table
        bordered={false}
        columns={columns}
        dataSource={data?.data?.filter((item) => item.name !== DEFAULT_SP) ?? []}
        loading={isLoading}
        pagination={false}
      />
    </div>
  );
};
