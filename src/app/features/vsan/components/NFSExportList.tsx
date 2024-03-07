import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getNFSExport } from '../api';

import { Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { NFSExport } from '../types';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/config/color';
import { REFETCH_INTERVAL } from '@app/config/time';

interface DataType {
  name: string;
  path: string;
  node: string;
  status: string;
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const success = status === 'OK';
        return <Tag color={success ? SUCCESS_COLOR : ERROR_COLOR}>{status}</Tag>;
      },
      align: 'center',
    },
  ];

  const { data, isLoading } = useQuery({
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
          });
        }
      });
    }

    return res;
  };

  return (
    <Table
      bordered={false}
      columns={columns}
      dataSource={handleTargetData(data?.data) ?? []}
      pagination={false}
      size="small"
      loading={isLoading}
    />
  );
};
