import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Table, Tag } from 'antd';
import type { TableProps } from 'antd';

import { ERROR_COLOR, SUCCESS_COLOR } from '@app/config/color';

import { ISCSITarget } from '../types';
import { getISCSITarget } from '../api';
import { REFETCH_INTERVAL } from '@app/config/time';

interface DataType {
  iqn: string;
  lun: number;
  node: string;
  status: string;
}

export const ISCSIList = () => {
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'IQN',
      dataIndex: 'iqn',
      key: 'iqn',
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
    queryKey: ['getISCSITarget'],
    queryFn: () => getISCSITarget(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const handleTargetData = (data: ISCSITarget[]): DataType[] => {
    const res: DataType[] = [];

    if (Array.isArray(data)) {
      data.forEach((t) => {
        if (t.status) {
          const temp = t.status.volumes
            ?.filter((l) => l.number !== 0)
            .map((l) => ({
              key: t.iqn,
              iqn: t.iqn,
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
