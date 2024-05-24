import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { deleteNVMeExport, getNVMeoFTarget } from '../api';

import { Button, notification, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { ErrorMessage, NVMeTarget } from '../types';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { REFETCH_INTERVAL } from '@app/const/time';
import { CreateNVMEOfForm } from './CreateNVMEOfForm';
import { formatBytes } from '@app/utils/size';
import { GrowVolume } from './GrowVolume';
import { ActionSection } from './styled';

interface DataType {
  nqn: string;
  lun: number;
  node: string;
  status: string;
  service_ip: string;
  size: number;
  resource_group: string;
}

type NVMeoFListProp = {
  complex?: boolean;
};

export const NVMeoFList = ({ complex }: NVMeoFListProp) => {
  const [api, contextHolder] = notification.useNotification();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getNVMeoFTarget'],
    queryFn: () => getNVMeoFTarget(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const deleteTarget = useMutation({
    mutationFn: (nqn: string) => deleteNVMeExport(nqn),
    onSuccess: () => {
      api.success({
        message: 'Delete NVMe-oF target successfully',
      });
      refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail,
        duration: 0,
      });
    },
  });

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
  ];

  if (complex) {
    columns.push({
      title: 'Action',
      key: 'action',
      render: (_, target) => {
        const names = target.nqn.split(':');
        const resourceName = names[names.length - 1];
        return (
          <Space>
            <GrowVolume
              resource={resourceName}
              resource_group={target.resource_group}
              current_kib={target.size}
              refetch={refetch}
            />
            <Popconfirm
              title="Are you sure to delete this target?"
              onConfirm={() => deleteTarget.mutate(target.nqn)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger loading={deleteTarget.isLoading}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
      align: 'center',
    });
  }

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
              service_ip: t.service_ip,
              size: t.volumes[1].size_kib,
              resource_group: t.resource_group,
            }));

          res.push(...temp);
        }
      });
    }

    return res;
  };

  return (
    <div>
      {contextHolder}
      {complex && (
        <>
          <p>This module allows exporting the highly available storage managed by LINSTOR via NVMe-oF.</p>
          <ActionSection style={{ marginBottom: 10 }}>
            <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
              Reload
            </Button>
            <CreateNVMEOfForm refetch={refetch} />
          </ActionSection>
        </>
      )}
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
