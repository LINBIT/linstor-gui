import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { getNVMeoFTarget } from '../api';

import { Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { NVMeTarget } from '../types';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/config/color';
import { REFETCH_INTERVAL } from '@app/config/time';

interface DataType {
  nqn: string;
  lun: number;
  node: string;
  status: string;
}

export const NVMeoFList = () => {
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'NQN',
      dataIndex: 'nqn',
      key: 'nqn',
    },
    {
      title: 'LUN',
      dataIndex: 'lun',
      key: 'lun',
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
    queryKey: ['getNVMeoFTarget'],
    queryFn: () => getNVMeoFTarget(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const handleTargetData = (data: NVMeTarget[]): DataType[] => {
    const res: DataType[] = [];

    if (Array.isArray(data)) {
      data.forEach((t) => {
        if (t.status) {
          const temp = t.status.volumes
            ?.filter((l) => l.number !== 0)
            .map((l) => ({
              key: t.nqn,
              nqn: t.nqn,
              lun: l.number,
              node: t?.status?.primary ?? '-',
              status: l.state,
            }));

          res.push(...temp);
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
