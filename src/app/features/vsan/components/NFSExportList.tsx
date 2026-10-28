// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { deleteNFSExport, getNFSExport } from '../api';

import { notification, Space, Table } from 'antd';
import { Tag } from '@app/components/Tag';
import type { TableProps } from 'antd';
import { ErrorMessage, NFSExport, Volume } from '../types';
import { REFETCH_INTERVAL } from '@app/const/time';
import { formatBytes } from '@app/utils/size';
import { GrowVolume } from './GrowVolume';
import { CreateNFSForm } from './CreateNFSForm';

import { Button } from '@app/components/Button';
import { Popconfirm } from '@app/components/Popconfirm';

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
  const { t } = useTranslation();
  const [api, contextHolder] = notification.useNotification();

  const deleteMutation = useMutation({
    mutationFn: (iqn: string) => deleteNFSExport(iqn),
    onSuccess: () => {
      api.success({
        title: t('vsan:nfs_deleted'),
      });
      refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        title: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const columns: TableProps<DataType>['columns'] = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('nfs:export_path'),
      dataIndex: 'path',
      key: 'path',
      render: (path) => {
        return <code>{path}</code>;
      },
    },
    {
      title: t('iscsi:on_node'),
      dataIndex: 'node',
      key: 'node',
    },
    {
      title: t('nfs:service_ip'),
      dataIndex: 'service_ip',
      key: 'service_ip',
    },
    {
      title: t('common:size'),
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        return <span>{formatBytes(size)}</span>;
      },
    },
    {
      title: t('common:status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const success = status === 'OK';
        return <Tag tone={success ? 'success' : 'danger'}>{status}</Tag>;
      },
      align: 'center',
    },
  ];

  if (complex) {
    columns.push({
      title: t('common:action'),
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
              title={t('common:delete_nfs_target')}
              description={t('common:are_you_sure_delete_nfs_target', { name: target.name })}
              onConfirm={() => {
                deleteMutation.mutate(target.name);
              }}
            >
              <Button type="default" danger loading={deleteMutation.isPending}>
                {t('common:delete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
      align: 'center',
    });
  }

  const { data, isPending, refetch } = useQuery({
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

  const listData = handleTargetData(data?.data ?? []);

  return (
    <div>
      {contextHolder}
      {complex && (
        <>
          <p>{t('vsan:nfs_intro')}</p>
          <div className="mb-2.5">
            <Button onClick={() => refetch()} className="mr-2.5">
              {t('common:reload')}
            </Button>
            <CreateNFSForm refetch={refetch} disabled={listData.length >= 1} />
          </div>
        </>
      )}
      <Table
        rowKey="name"
        bordered={false}
        columns={columns}
        dataSource={listData}
        loading={isPending}
        pagination={false}
      />
    </div>
  );
};
