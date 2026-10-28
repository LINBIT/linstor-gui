// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { deleteResourceGroup, getResourceGroups } from '../api';

import { Table, notification } from 'antd';
import type { TableProps } from 'antd';
import { DEFAULT_SP } from '@app/const/type';
import { CreateResourceGroup } from './CreateResourceGroup';
import { ErrorMessage, VsanResourceGroup } from '@app/features/vsan';

import { Button } from '@app/components/Button';
import { Popconfirm } from '@app/components/Popconfirm';
import { variablesOnly } from '@app/utils/mutation';

export const ResourceGroupList = () => {
  const { t } = useTranslation();
  const [api, contextHolder] = notification.useNotification();

  const { data, refetch, isPending } = useQuery({
    queryKey: ['getResourceGroups'],
    queryFn: () => getResourceGroups(),
  });

  const deleteMutation = useMutation({
    mutationFn: variablesOnly(deleteResourceGroup),
    onSuccess: () => {
      api.success({
        title: t('vsan:delete_rg_success'),
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

  const columns: TableProps<VsanResourceGroup>['columns'] = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('common:storage_pool'),
      dataIndex: 'select_filter',
      key: 'storage_pool',
      render: (select_filter) => {
        return <div>{select_filter?.storage_pool}</div>;
      },
    },
    {
      title: t('vsan:replica_count'),
      dataIndex: 'select_filter',
      key: 'place_count',
      render: (select_filter) => {
        return <div>{select_filter?.place_count}</div>;
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      render: (_, record) => {
        return (
          <Popconfirm
            key="delete"
            title={t('resource_group:delete_resource_group')}
            description={t('resource_group:are_you_sure_delete_resource_group', { name: record.name })}
            onConfirm={() => {
              deleteMutation.mutate(record.name);
            }}
          >
            <Button type="default" danger loading={deleteMutation.isPending}>
              {t('common:delete')}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-2.5">
        <Button onClick={() => refetch()} className="mr-2.5">
          {t('common:reload')}
        </Button>

        <CreateResourceGroup refetch={refetch} />
      </div>
      <Table
        rowKey="name"
        bordered={false}
        columns={columns}
        dataSource={data?.data?.filter((item) => item.name !== DEFAULT_SP) ?? []}
        loading={isPending}
        pagination={false}
      />
    </div>
  );
};
