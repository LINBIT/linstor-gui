// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Select, Popconfirm, message } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { deleteSchedule, getScheduleList } from '../api';
import { SearchForm } from './styled';
import ScheduleModal from './ScheduleModal';

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

  const deleteScheduleMutation = useMutation({
    mutationFn: async (schedule_name: string) => {
      try {
        await deleteSchedule(schedule_name);

        refetch();
      } catch (error) {
        message.error('Delete failed: ' + error);
        console.log(error);
      }
    },
  });

  const handleDelete = async (schedule_name: string) => {
    deleteScheduleMutation.mutate(schedule_name);
  };

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
      title: t('common:action'),
      key: 'action',
      align: 'center',
      render: (record) => {
        return (
          <Space>
            <ScheduleModal refetch={refetch} schedule={record} />
            <Popconfirm
              title="Delete this schedule?"
              onConfirm={() => {
                handleDelete(record.schedule_name);
              }}
            >
              <Button danger>{t('common:delete')}</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <SearchForm>
        <Form form={form} layout="inline">
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder="Name" onChange={(e) => setSearchName(e.target.value)} allowClear />
          </Form.Item>

          <Form.Item>
            <ScheduleModal refetch={refetch} />
          </Form.Item>
        </Form>
      </SearchForm>

      <br />

      <Table
        columns={columns as any}
        dataSource={filteredData ?? []}
        pagination={{
          total: filteredData?.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        loading={isLoading}
      />
    </>
  );
};
