// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Alert, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import { formatBytes } from '@app/utils/size';

import { NFSResource } from '../types';
import { ExportBasePath } from '../const';

type NFSListProps = {
  list: NFSResource[];
  handleDelete: (iqn: string) => void;
  handleStart: (iqn: string) => void;
  handleStop: (iqn: string) => void;
  loading?: boolean;
};

type NFSOperationStatus = {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

export const NFSList = ({ list, handleDelete, handleStop, handleStart, loading = false }: NFSListProps) => {
  const { t } = useTranslation(['common', 'nfs']);
  const columns: TableProps<NFSResource & NFSOperationStatus>['columns'] = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('common:node'),
      key: 'node',
      render: (_, item) => {
        const nodeName = item?.status?.primary;
        if (!nodeName) return <span>-</span>;
        return <Link to={`/inventory/nodes/${nodeName}`}>{nodeName}</Link>;
      },
    },
    {
      title: t('nfs:service_ip'),
      dataIndex: 'service_ip',
      key: 'service_ip',
    },
    {
      title: t('nfs:export_path'),
      dataIndex: 'path',
      render: (_, item) => {
        return <code>{exportPath(item)}</code>;
      },
    },
    {
      title: t('common:size'),
      dataIndex: 'size',
      key: 'size',
      render: (_, item) => {
        const totalSize = item.volumes?.reduce((sum, vol) => sum + (vol.size_kib || 0), 0) || 0;
        return <span>{totalSize > 0 ? formatBytes(totalSize) : '-'}</span>;
      },
    },
    {
      title: t('nfs:service_state'),
      dataIndex: 'service_state',
      align: 'center',
      render: (_, item) => {
        const isStarted = item?.status?.service === 'Started';
        return <Tag color={isStarted ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.service}</Tag>;
      },
    },
    {
      title: t('nfs:linstor_state'),
      dataIndex: 'linstor_state',
      render: (_, item) => {
        const isOk = item?.status?.state === 'OK';
        return <Tag color={isOk ? SUCCESS_COLOR : ERROR_COLOR}>{item?.status?.state}</Tag>;
      },
      align: 'center',
    },
    {
      title: t('common:action'),
      key: 'action',
      render: (_text, record) => {
        const isStarted = record?.status?.service === 'Started';

        return (
          <Space size="small">
            <Popconfirm
              title={`Are you sure to ${isStarted ? 'stop' : 'start'} this target?`}
              onConfirm={() => {
                if (record.name) {
                  if (isStarted) {
                    handleStop(record.name);
                  } else {
                    handleStart(record.name);
                  }
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="secondary" size="small" loading={record.starting || record.stopping}>
                {record.starting && t('common:starting')}
                {record.stopping && t('common:stopping')}
                {!record.starting && !record.stopping && isStarted && t('common:stop')}
                {!record.starting && !record.stopping && !isStarted && t('common:start')}
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Are you sure to delete this target?"
              onConfirm={() => {
                if (record.name) {
                  handleDelete(record.name);
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger size="small" loading={record.deleting}>
                {record.deleting ? t('common:deleting') : t('common:delete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const exportPath = (e: NFSResource): string => {
    if (!e.volumes || !e.volumes[1]) {
      return `${ExportBasePath}/${e?.name}`;
    }
    // Use export_path from volume 1 (the actual data volume, not metadata)
    const volume1 = e.volumes.find((v) => v.number === 1) || e.volumes[1];
    const exportPathSuffix = (volume1 as any)?.export_path || '';
    return `${ExportBasePath}/${e?.name}${exportPathSuffix}`;
  };

  return (
    <div>
      <Alert
        message="NOTE: Only one NFS resource can exist in a cluster. To create multiple exports, create a single resource with multiple volumes."
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Table bordered={false} columns={columns} dataSource={list ?? []} loading={loading} scroll={{ x: 960 }} />
    </div>
  );
};
