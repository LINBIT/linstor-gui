// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { Form, Space, Table, Dropdown, Tooltip } from 'antd';
import { Input } from '@app/components/Input';
import type { TableProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';

import { deleteSchedule, getScheduleList } from '../api';
import { SearchForm } from './styled';
import ScheduleModal from './ScheduleModal';
import { Popconfirm } from '@app/components/Popconfirm';
import { deletingRowClass, useDeleteAction } from '@app/hooks/useDeleteAction';

export const List = () => {
  const [form] = Form.useForm();
  const [searchName, setSearchName] = useState<string>('');
  const { t } = useTranslation(['remote', 'common']);

  const {
    isLoading,
    refetch,
    data: dataList,
  } = useQuery({
    queryKey: ['getScheduleList'],
    queryFn: async () => {
      const res = await getScheduleList();

      return res?.data?.data;
    },
  });

  const del = useDeleteAction<{ schedule_name: string }>({
    remove: (schedule) => deleteSchedule(schedule.schedule_name),
    keyOf: (schedule) => schedule.schedule_name,
    nameOf: (schedule) => schedule.schedule_name,
    refresh: () => refetch(),
  });

  const filteredData = (dataList ?? [])?.filter((item) =>
    item.schedule_name.toLowerCase().includes(searchName.toLowerCase()),
  );

  const columns: TableProps<{
    schedule_name: string;
    full_cron: string;
    inc_cron?: string;
    keep_local?: number;
    keep_remote?: number;
    on_failure?: 'SKIP' | 'RETRY';
    max_retries?: number;
  }>['columns'] = [
    {
      title: t('schedule:name'),
      key: 'schedule_name',
      dataIndex: 'schedule_name',
    },
    {
      title: t('schedule:full_cron'),
      key: 'full_cron',
      dataIndex: 'full_cron',
    },
    {
      title: t('schedule:inc_cron'),
      key: 'inc_cron',
      dataIndex: 'inc_cron',
    },
    {
      title: t('schedule:keep_local'),
      key: 'keep_local',
      dataIndex: 'keep_local',
      render: (text) => {
        return text ?? 'All';
      },
    },
    {
      title: t('schedule:keep_remote'),
      key: 'keep_remote',
      dataIndex: 'keep_remote',
      render: (text) => {
        return text ?? 'All';
      },
    },
    {
      title: t('schedule:on_failure'),
      key: 'on_failure',
      dataIndex: 'on_failure',
    },
    {
      title: () => (
        <Tooltip title={t('common:action')}>
          <span className="flex justify-center">
            <LiaToolsSolid className="w-4 h-4" />
          </span>
        </Tooltip>
      ),
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (record) => {
        return (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: <ScheduleModal refetch={refetch} schedule={record} isInDropdown={true} />,
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm title={t('schedule:delete_schedule')} onConfirm={() => del.run([record])}>
                        {t('common:delete')}
                      </Popconfirm>
                    ),
                  },
                ],
              }}
            >
              <MoreOutlined style={{ cursor: 'pointer', fontSize: 16 }} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <SearchForm>
        <Form form={form} layout="inline" style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder={t('common:name')} onChange={(e) => setSearchName(e.target.value)} allowClear />
          </Form.Item>

          <Form.Item style={{ marginLeft: 'auto', marginRight: 0 }}>
            <ScheduleModal refetch={refetch} />
          </Form.Item>
        </Form>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={filteredData ?? []}
        pagination={{
          total: filteredData?.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => t('common:total_items', { total }),
        }}
        loading={isLoading}
        rowClassName={(record) => (del.isDeleting(record.schedule_name) ? deletingRowClass : '')}
      />
    </>
  );
};
