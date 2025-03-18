// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { ERROR_COLOR, SUCCESS_COLOR } from '@app/const/color';

import { NFSResource } from '../types';
import { ExportBasePath } from '../const';

type NFSListProps = {
  list: NFSResource[];
  handleDelete: (iqn: string) => void;
  handleStart: (iqn: string) => void;
  handleStop: (iqn: string) => void;
};

type NFSOperationStatus = {
  deleting?: boolean;
  starting?: boolean;
  stopping?: boolean;
};

export const NFSList = ({ list, handleDelete, handleStop, handleStart }: NFSListProps) => {
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
        return <span>{item?.status?.primary}</span>;
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
      title: t('nfs:service_state'),
      dataIndex: 'service_state',
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
      render: (text, record) => {
        const isStarted = record?.status?.service === 'Started';

        return (
          <Space size="middle">
            <Popconfirm
              title={`Are you sure to ${isStarted ? 'stop' : 'start'} this target?`}
              onConfirm={() => {
                if (record.name) {
                  isStarted ? handleStop(record.name) : handleStart(record.name);
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger loading={record.starting || record.stopping}>
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
              <Button type="primary" danger loading={record.deleting}>
                {record.deleting ? t('common:deleting') : t('common:delete')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const exportPath = (e: NFSResource): string => {
    if (!e.volumes) {
      return `${ExportBasePath}/${e?.name}`;
    }
    return `${ExportBasePath}/${e?.name}${e?.volumes?.[1]?.export_path}`;
  };

  return (
    <div>
      <Table bordered={false} columns={columns} dataSource={list ?? []} />
    </div>
  );
};
