// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getStoragePool } from '../api';
import type { VsanStoragePool } from '../types';

import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TableProps } from 'antd';
import { REFETCH_INTERVAL } from '@app/const/time';
import { formatBytes } from '@app/utils/size';
import { DEFAULT_SP } from '@app/const/type';
import { CreateStoragePoolForm } from '@app/features/vsan';

import { Button } from '@app/components/Button';

interface DataType {
  name: string;
  providerKind: string;
  capacities: {
    [node: string]: number;
  };
}

export const PhysicalStorageList = () => {
  const { data, isPending, refetch } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const { t } = useTranslation();
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const handleExpand = (expanded: boolean, record: VsanStoragePool) => {
    setExpandedRowKeys(expanded ? [record.name] : []);
  };

  const columns: TableProps<DataType>['columns'] = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('vsan:type'),
      dataIndex: 'providerKind',
      key: 'providerKind',
    },
    Table.EXPAND_COLUMN,
    {
      title: t('vsan:deployed_on_nodes'),
      dataIndex: 'capacities',
      key: 'capacities',
      render: (capacities) => {
        const nodes = Object.keys(capacities);
        return (
          <div>
            {nodes.map((node) => {
              return (
                <span key={node}>
                  {node}: {formatBytes(capacities[node])} &nbsp; &nbsp;
                </span>
              );
            })}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-2.5">
        <Button onClick={() => refetch()} className="mr-2.5">
          {t('common:reload')}
        </Button>

        <CreateStoragePoolForm refetch={refetch} />
      </div>

      <Table
        bordered={false}
        columns={columns}
        dataSource={data?.data?.filter((item) => item.name !== DEFAULT_SP) ?? []}
        loading={isPending}
        expandable={{
          // The expand column's header, for screen readers (antd leaves it empty).
          columnTitle: <span className="sr-only">{t('common:detail')}</span>,
          expandedRowRender: (record) => {
            const nodes = Object.keys(record?.capacities) ?? [];
            return (
              <div className="m-0">
                {nodes.map((node) => {
                  return (
                    <div key={node}>
                      {node}: {formatBytes(record?.capacities[node])}
                    </div>
                  );
                })}
              </div>
            );
          },
          expandRowByClick: true,
          expandedRowKeys,
          onExpand: handleExpand,
        }}
        pagination={false}
        rowKey="name"
      />
    </div>
  );
};
