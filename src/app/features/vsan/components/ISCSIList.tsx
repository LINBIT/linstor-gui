import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { Button, Popconfirm, Space, Table, Tag, notification } from 'antd';
import type { TableProps } from 'antd';

import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';

import { ErrorMessage, ISCSITarget } from '../types';
import { deleteISCISExport, getISCSITarget } from '../api';
import { REFETCH_INTERVAL } from '@app/const/time';
import { CreateISCSIForm } from './CreateISCSIForm';
import { formatBytes } from '@app/utils/size';
import { GrowVolume } from './GrowVolume';
import { ActionSection } from './styled';

interface DataType {
  iqn: string;
  lun: number;
  node: string;
  status: string;
  resource_group: string;
  size: number;
}

type ISCSIListProp = {
  complex?: boolean;
};

export const ISCSIList = ({ complex }: ISCSIListProp) => {
  const [api, contextHolder] = notification.useNotification();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getISCSITarget'],
    queryFn: () => getISCSITarget(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteISCISExport,
    onSuccess: () => {
      api.success({
        message: 'Delete ISCSI target successfully',
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
        return (
          <Space>
            <GrowVolume
              resource_group={target.resource_group}
              current_kib={target.size}
              resource={target.iqn.split(':')[1]}
              refetch={refetch}
            />
            <Popconfirm
              key="delete"
              title="Delete the ISCSI target"
              description="Are you sure to delete this ISCSI target?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                deleteMutation.mutate(target.iqn);
              }}
            >
              <Button type="default" danger loading={deleteMutation.isLoading}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
      align: 'center',
    });
  }

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
          <p>
            Here, the new storage managed by LINSTOR can be exposed as an iSCSI target. This allows you to use the
            replicated storage with an iSCSI initiator.
          </p>

          <ActionSection>
            <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
              Reload
            </Button>
            <CreateISCSIForm refetch={refetch} />
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
