import React, { useState } from 'react';
import { Button, Form, Table, Input, Popconfirm } from 'antd';
import type { TableProps } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { getScheduleByResource } from '../api';
import { SearchForm } from './styled';
import { formatTimeUTC } from '@app/utils/time';
import { EnterPassphrase } from '@app/features/settings';
import { ScheduleByResource } from '../types';
import { useNavigate } from 'react-router-dom';
import EnableScheduleForm from './EnableScheduleForm';

export const ScheduleByResourceList = () => {
  const [form] = Form.useForm();
  const [searchResource, setSearchResource] = useState<string>('');
  const navigate = useNavigate();

  const { data: dataList, isLoading } = useQuery({
    queryKey: ['getScheduleByResource'],
    queryFn: async () => {
      const res = await getScheduleByResource({
        'active-only': true,
      });

      return res?.data?.data;
    },
  });

  const filteredData = (dataList ?? [])?.filter((item) =>
    item.rsc_name.toLowerCase().includes(searchResource.toLowerCase()),
  );

  const columns: TableProps<ScheduleByResource>['columns'] = [
    {
      title: <span>Resource</span>,
      key: 'rsc_name',
      dataIndex: 'rsc_name',
    },
    {
      title: 'Remote',
      key: 'remote',
      dataIndex: 'remote_name',
    },
    {
      title: 'Schedule',
      key: 'schedule_name',
      dataIndex: 'schedule_name',
    },
    {
      title: 'Last',
      key: 'Last',
      dataIndex: 'last_snap_time',
      render: (last_snap_time) => {
        const showTime = last_snap_time && last_snap_time > 0;

        return <div>{showTime ? formatTimeUTC(last_snap_time) : ''}</div>;
      },
    },
    {
      title: 'Next',
      key: 'next',
      dataIndex: 'next_exec_time',
      render: (next_exec_time) => {
        const showTime = next_exec_time && next_exec_time > 0;

        return <div>{showTime ? formatTimeUTC(next_exec_time) : ''}</div>;
      },
    },
    {
      title: 'Planned Inc',
      key: 'planned_inc',
      dataIndex: 'next_planned_inc',
      render: (next_planned_inc) => {
        const showTime = next_planned_inc && next_planned_inc > 0;

        return <div>{showTime ? formatTimeUTC(next_planned_inc) : ''}</div>;
      },
    },
    {
      title: 'Planned Full',
      key: 'planned_full',
      dataIndex: 'next_planned_full',
      render: (next_planned_full) => {
        const showTime = next_planned_full && next_planned_full > 0;

        return <div>{showTime ? formatTimeUTC(next_planned_full) : ''}</div>;
      },
    },
    {
      title: 'Reason',
      key: 'reason',
      dataIndex: 'reason',
    },
    {
      title: 'Action',
      key: 'action',
      render: (record) => {
        return (
          <Popconfirm title="Delete this backup?" onConfirm={() => {}}>
            <Button danger>Delete</Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <>
      <SearchForm>
        <Form
          form={form}
          name="storage_pool_search"
          layout="inline"
          initialValues={{
            show_default: true,
          }}
        >
          <Form.Item name="origin_rsc" label="Resource">
            <Input
              placeholder="Resource"
              value={searchResource}
              onChange={(e) => setSearchResource(e.target.value)}
              allowClear
            />
          </Form.Item>

          <Form.Item>
            <EnableScheduleForm />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={() => navigate('/schedule/list')}>
              Schedules
            </Button>
          </Form.Item>
        </Form>

        <EnterPassphrase />
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
