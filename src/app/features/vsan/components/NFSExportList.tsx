// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteNFSExport, getNFSExport } from '../api';

import { Button, notification, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { ErrorMessage, NFSExport, Volume } from '../types';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { REFETCH_INTERVAL } from '@app/const/time';
import { formatBytes } from '@app/utils/size';
import { GrowVolume } from './GrowVolume';
import { CreateNFSForm } from './CreateNFSForm';
import { ActionSection } from './styled';

interface DataType {
  name: string;
  path: string;
  node: string;
  status: string;
  service_ip: string;
  size: number;
  resource_group: string;
  children?: DataType[];
}

type NFSExportListProp = {
  complex?: boolean;
};

export const NFSExportList = ({ complex }: NFSExportListProp) => {
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
  ];

  if (complex) {
    columns.push({
      title: 'Action',
      key: 'action',
      render: (_, target) => {
        if (!target.children) {
          return null;
        }
        return (
          <Space>
            <GrowVolume
              resource={target.name}
              resource_group={target.resource_group}
              current_kib={target.size}
              refetch={refetch}
            />
            <Popconfirm
              key="delete"
              title="Delete the NFS target"
              description="Are you sure to delete this NFS target?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                deleteMutation.mutate(target.name);
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['getNFSExport'],
    queryFn: () => getNFSExport(),
    refetchInterval: REFETCH_INTERVAL,
  });

  interface ProcessedNFSData extends DataType {
    children?: DataType[];
  }

  const exportPath = (e: Volume, nfsName: string): string => {
    return `/srv/gateway-exports/${nfsName}${e?.export_path}`;
  };

  const handleTargetData = (data: NFSExport[]): DataType[] => {
    const res: DataType[] = [];

    if (Array.isArray(data)) {
      data.forEach((t) => {
        if (t.status) {
          const nfs = t;
          const volumes = nfs.volumes.filter((v) => v.number !== 0);

          if (volumes.length === 0) {
            return null;
          }

          const mainVolume = volumes[0];
          const result: ProcessedNFSData = {
            name: nfs.name,
            path: exportPath(mainVolume, nfs.name),
            node: nfs.status ? nfs.status.primary : '-',
            status: nfs.status?.state ?? '-',
            service_ip: nfs.service_ip,
            size: mainVolume.size_kib,
            resource_group: nfs.resource_group,
          };

          if (volumes.length > 1) {
            result.children = volumes.slice(1).map((v) => ({
              name: '',
              path: exportPath(v, nfs.name),
              node: '',
              status: nfs.status?.state ?? '-',
              service_ip: '',
              size: v.size_kib,
              resource_group: '',
            }));
          }

          res.push(result);
        }
      });
    }

    return res;
  };

  const listData = handleTargetData(data?.data) ?? [];

  return (
    <div>
      {contextHolder}
      {complex && (
        <>
          <p>This module allows exporting the highly available storage managed by LINSTOR via an NFS export.</p>
          <ActionSection>
            <Button onClick={() => refetch()} style={{ marginRight: 10 }}>
              Reload
            </Button>
            <CreateNFSForm refetch={refetch} disabled={listData.length >= 1} />
          </ActionSection>
        </>
      )}
      <Table bordered={false} columns={columns} dataSource={listData} loading={isLoading} pagination={false} />
    </div>
  );
};
