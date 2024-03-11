import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getNFSExport } from '../api';

import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { NFSExport } from '../types';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { REFETCH_INTERVAL } from '@app/const/time';
import { CreateISCSIForm } from './CreateISCSIForm';
import { formatBytes } from '@app/utils/size';

interface DataType {
  name: string;
  path: string;
  node: string;
  status: string;
  service_ip: string;
  size: number;
}

export const NFSExportList = () => {
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
      render: (_, target) => {
        return (
          <Space>
            <Button type="primary">Grow Volume</Button>
            <Popconfirm
              title="Delete the target"
              description="Are you sure to delete this target?"
              onConfirm={() => {
                console.log('');
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        );
      },
      align: 'center',
    },
  ];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getNFSExport'],
    queryFn: () => getNFSExport(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const exportPath = (e: NFSExport): string => {
    return `/srv/gateway-exports/${e.name}${e.volumes[1].export_path}`;
  };

  const handleTargetData = (data: NFSExport[]): DataType[] => {
    const res: DataType[] = [];

    if (Array.isArray(data)) {
      data.forEach((t) => {
        if (t.status) {
          const l = t.status.volumes[1];

          res.push({
            name: t.name,
            path: exportPath(t),
            node: t.status ? t.status.primary : '-',
            status: l.state,
            service_ip: t.service_ip,
            size: t.volumes[1].size_kib,
          });
        }
      });
    }

    return res;
  };

  return (
    <div>
      <p>This module allows exporting the highly available storage managed by LINSTOR via an NFS export.</p>
      <div style={{ marginBottom: 10 }}>
        <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
          Reload
        </Button>
        <CreateISCSIForm />
      </div>
      <Table bordered={false} columns={columns} dataSource={handleTargetData(data?.data) ?? []} loading={isLoading} />
    </div>
  );
};
