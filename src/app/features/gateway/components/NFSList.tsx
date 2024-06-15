import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { getNFSList } from '../api';

import { Button, notification, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { REFETCH_INTERVAL } from '@app/const/time';
import { formatBytes } from '@app/utils/size';

interface DataType {
  name: string;
  path: string;
  node: string;
  status: string;
  service_ip: string;
  size: number;
  resource_group: string;
}

export const NFSList = () => {
  const [api, contextHolder] = notification.useNotification();

  const deleteMutation = useMutation({
    mutationFn: (iqn: string) => deleteNFSExport(iqn),
    onSuccess: () => {
      api.success({
        message: 'Target has been deleted!',
      });
      refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
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
      title: 'Export Path',
      dataIndex: 'path',
      key: 'path',
      render: (path) => {
        return <code>{path}</code>;
      },
    },
    {
      title: 'On Node',
      dataIndex: 'node',
      key: 'node',
    },
    {
      title: 'Service IP',
      dataIndex: 'service_ip',
      key: 'service_ip',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        return <span>{formatBytes(size)}</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const success = status === 'OK';
        return <Tag color={success ? SUCCESS_COLOR : ERROR_COLOR}>{status}</Tag>;
      },
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Space size="middle">
          <Popconfirm
            title="Are you sure to stop this target?"
            onConfirm={() => deleteMutation.mutate(record.name)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Stop</Button>
          </Popconfirm>
          <Popconfirm
            title="Are you sure to delete this target?"
            onConfirm={() => deleteMutation.mutate(record.name)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getNFSExport'],
    queryFn: () => getNFSList(),
  });

  const exportPath = (e: NFSExport): string => {
    if (!e.volumes) {
      return `/srv/gateway-exports/${e?.name}`;
    }
    return `/srv/gateway-exports/${e?.name}${e?.volumes?.[1]?.export_path}`;
  };

  const handleTargetData = (data: NFSExport[]): DataType[] => {
    const res: DataType[] = [];

    if (Array.isArray(data)) {
      data.forEach((t) => {
        if (t.status) {
          const l = t.status?.volumes?.[1];

          res.push({
            name: t.name,
            path: exportPath(t),
            node: t.status ? t.status.primary : '-',
            status: l?.state,
            service_ip: t.service_ip,
            size: t?.volumes?.[1]?.size_kib,
            resource_group: t.resource_group,
          });
        }
      });
    }

    return res;
  };

  return (
    <div>
      {contextHolder}
      <Table
        bordered={false}
        columns={columns}
        dataSource={handleTargetData(data?.data) ?? []}
        loading={isLoading}
        pagination={false}
      />
    </div>
  );
};
