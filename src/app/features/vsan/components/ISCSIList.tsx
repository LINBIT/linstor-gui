import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Button, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';

import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';

import { ISCSITarget } from '../types';
import { getISCSITarget } from '../api';
import { REFETCH_INTERVAL } from '@app/const/time';
import { CreateISCSIForm } from './CreateISCSIForm';
import { formatBytes } from '@app/utils/size';

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
      title: 'Service IP',
      dataIndex: 'service_ip',
      key: 'service_ip',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        console.log(size, 'size');
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
            <Button danger>Delete</Button>
          </Space>
        );
      },
      align: 'center',
    },
  ];

  const { data, isLoading, refetch } = useQuery({
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
              service_ip: t.service_ips[0] ?? '',
              size: t.volumes[1].size_kib,
            }));

          res.push(...temp);
        }
      });
    }

    return res;
  };

  return (
    <div>
      <p>
        Here, the new storage managed by LINSTOR can be exposed as an iSCSI target. This allows you to use the
        replicated storage with an iSCSI initiator.
      </p>

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
