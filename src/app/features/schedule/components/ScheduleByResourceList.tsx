import React, { useState } from 'react';
import { Button, Form, Table, Input, Popconfirm, message, Space, Checkbox, Dropdown, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';

import { getScheduleByResource, disableSchedule, deleteBackupSchedule, enableSchedule } from '../api';
import { SearchForm } from './styled';
import { formatTimeUTC } from '@app/utils/time';
import { EnterPassphrase } from '@app/features/settings';
import { ScheduleByResource } from '../types';
import { useNavigate } from 'react-router-dom';
import EnableScheduleForm from './EnableScheduleForm';

export const ScheduleByResourceList = () => {
  const [form] = Form.useForm();
  const [searchResource, setSearchResource] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const navigate = useNavigate();

  const {
    data: dataList,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['getScheduleByResource', showAll],
    queryFn: async () => {
      const params = showAll ? {} : { 'active-only': true };
      const res = await getScheduleByResource(params);

      return res?.data?.data;
    },
  });

  const disableScheduleMutation = useMutation({
    mutationFn: async (record: ScheduleByResource) => {
      try {
        await disableSchedule(record.remote_name, record.schedule_name, {
          rsc_name: record.rsc_name,
          force_mv_rsc_grp: false,
          force_restore: false,
        });
        message.success('Schedule disabled successfully');
        refetch();
      } catch (error) {
        console.error('Disable schedule error:', error);
        message.error('Failed to disable schedule');
      }
    },
  });

  const enableScheduleMutation = useMutation({
    mutationFn: async (record: ScheduleByResource) => {
      try {
        await enableSchedule(record.remote_name, record.schedule_name, {
          rsc_name: record.rsc_name,
          force_mv_rsc_grp: false,
          force_restore: false,
        });
        message.success('Schedule enabled successfully');
        refetch();
      } catch (error) {
        console.error('Enable schedule error:', error);
        message.error('Failed to enable schedule');
      }
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (record: ScheduleByResource) => {
      try {
        await deleteBackupSchedule(record.remote_name, record.schedule_name, {
          rsc_dfn_name: record.rsc_name,
        });
        message.success('Schedule deleted successfully');
        refetch();
      } catch (error) {
        console.error('Delete schedule error:', error);
        message.error('Failed to delete schedule');
      }
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
      title: () => (
        <Tooltip title="Action">
          <span className="flex justify-center">
            <LiaToolsSolid className="w-4 h-4" />
          </span>
        </Tooltip>
      ),
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        if (record?.reason === 'none set') {
          return null;
        }

        return (
          <Space size="small">
            <Dropdown
              menu={{
                items: [
                  ...(record?.reason === 'disabled'
                    ? [
                        {
                          key: 'enable',
                          label: (
                            <Popconfirm
                              title="Are you sure you want to enable this schedule?"
                              onConfirm={() => enableScheduleMutation.mutate(record)}
                            >
                              Enable
                            </Popconfirm>
                          ),
                        },
                      ]
                    : [
                        {
                          key: 'disable',
                          label: (
                            <Popconfirm
                              title="Are you sure you want to disable this schedule?"
                              onConfirm={() => disableScheduleMutation.mutate(record)}
                            >
                              Disable
                            </Popconfirm>
                          ),
                        },
                      ]),
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        title="Are you sure you want to delete this schedule?"
                        description="This action cannot be undone!"
                        onConfirm={() => deleteScheduleMutation.mutate(record)}
                      >
                        Delete
                      </Popconfirm>
                    ),
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
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

          <Form.Item name="show_all" valuePropName="checked">
            <Checkbox onChange={(e) => setShowAll(e.target.checked)}>Show All</Checkbox>
          </Form.Item>

          <Form.Item>
            <EnableScheduleForm onSuccess={refetch} />
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
