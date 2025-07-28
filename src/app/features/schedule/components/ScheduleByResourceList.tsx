import React, { useState } from 'react';
import { Button, Form, Table, Input, Popconfirm, message, Space, Checkbox, Dropdown, Tooltip, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';
import { useTranslation } from 'react-i18next';

import {
  getScheduleByResource,
  disableSchedule,
  deleteBackupSchedule,
  enableSchedule,
  getScheduleByResourceName,
} from '../api';
import { SearchForm } from './styled';
import { formatTimeUTC } from '@app/utils/time';
import { ScheduleByResource, ScheduleDetails } from '../types';
import { useNavigate } from 'react-router-dom';
import EnableScheduleForm from './EnableScheduleForm';
import { RootState } from '@app/store';
import { useSelector } from 'react-redux';
import { UIMode } from '@app/models/setting';

export const ScheduleByResourceList = () => {
  const { t } = useTranslation(['schedule', 'common']);
  const [form] = Form.useForm();
  const [searchResource, setSearchResource] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const navigate = useNavigate();

  const { mode } = useSelector((state: RootState) => ({
    mode: state.setting.mode,
  }));

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
        message.success(t('schedule:schedule_disabled_success'));
        refetch();
      } catch (error) {
        console.error('Disable schedule error:', error);
        message.error(t('schedule:schedule_disable_failed'));
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
        message.success(t('schedule:schedule_enabled_success'));
        refetch();
      } catch (error) {
        console.error('Enable schedule error:', error);
        message.error(t('schedule:schedule_enable_failed'));
      }
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (record: ScheduleByResource) => {
      try {
        await deleteBackupSchedule(record.remote_name, record.schedule_name, {
          rsc_dfn_name: record.rsc_name,
        });
        message.success(t('schedule:schedule_deleted_success'));
        refetch();
      } catch (error) {
        console.error('Delete schedule error:', error);
        message.error(t('schedule:schedule_delete_failed'));
      }
    },
  });

  const { data: resourceDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ['getScheduleByResourceName', expandedRowKeys],
    queryFn: async () => {
      if (!expandedRowKeys.length) return null;

      try {
        const rscName = expandedRowKeys[0];
        const res = await getScheduleByResourceName(rscName);
        return res?.data?.data;
      } catch (error) {
        console.error('Failed to fetch resource details:', error);
        message.error(t('schedule:resource_details_load_failed'));
        return null;
      }
    },
    enabled: expandedRowKeys.length > 0,
  });

  const handleExpand = (expanded: boolean, record: ScheduleByResource) => {
    setExpandedRowKeys(expanded ? [record.rsc_name] : []);
  };

  const expandedRowRender = () => {
    const detailColumns: TableProps<ScheduleDetails>['columns'] = [
      {
        title: t('schedule:remote'),
        dataIndex: 'remote_name',
        key: 'remote_name',
      },
      {
        title: t('schedule:schedule'),
        dataIndex: 'schedule_name',
        key: 'schedule_name',
      },
      {
        title: t('schedule:resource_definition'),
        dataIndex: 'rsc_dfn',
        key: 'rsc_dfn',
        render: (enabled) => {
          return enabled ? <Tag color="green">{t('schedule:enabled')}</Tag> : '';
        },
      },
      {
        title: t('schedule:resource_group'),
        dataIndex: 'rsc_grp',
        key: 'rsc_grp',
        render: (enabled) => {
          return enabled ? <Tag color="green">{t('schedule:enabled')}</Tag> : '';
        },
      },
      {
        title: t('schedule:controller'),
        dataIndex: 'ctrl',
        key: 'ctrl',
        render: (enabled) => {
          return enabled ? <Tag color="green">{t('schedule:enabled')}</Tag> : '';
        },
      },
    ];

    const detailData: ScheduleDetails[] = resourceDetailData
      ? (Array.isArray(resourceDetailData) ? resourceDetailData : [resourceDetailData]).map((item: any) => ({
          remote_name: item.remote_name || '',
          schedule_name: item.schedule_name || '',
          rsc_dfn: item.rsc_dfn,
          rsc_grp: item.rsc_grp,
          ctrl: item.ctrl,
        }))
      : [];

    return (
      <Table
        columns={detailColumns}
        dataSource={detailData}
        pagination={false}
        loading={detailLoading}
        bordered
        size="small"
        rowKey={(record) => `${record.remote_name}-${record.schedule_name}`}
      />
    );
  };

  const filteredData = (dataList ?? [])?.filter((item) =>
    item.rsc_name.toLowerCase().includes(searchResource.toLowerCase()),
  );

  const columns: TableProps<ScheduleByResource>['columns'] = [
    {
      title: <span>{t('schedule:resource')}</span>,
      key: 'rsc_name',
      dataIndex: 'rsc_name',
    },
    {
      title: t('schedule:remote'),
      key: 'remote',
      dataIndex: 'remote_name',
    },
    {
      title: t('schedule:schedule'),
      key: 'schedule_name',
      dataIndex: 'schedule_name',
    },
    {
      title: t('schedule:last'),
      key: 'Last',
      dataIndex: 'last_snap_time',
      render: (last_snap_time) => {
        const showTime = last_snap_time && last_snap_time > 0;

        return <div>{showTime ? formatTimeUTC(last_snap_time) : ''}</div>;
      },
    },
    {
      title: t('schedule:next'),
      key: 'next',
      dataIndex: 'next_exec_time',
      render: (next_exec_time) => {
        const showTime = next_exec_time && next_exec_time > 0;

        return <div>{showTime ? formatTimeUTC(next_exec_time) : ''}</div>;
      },
    },
    {
      title: t('schedule:planned_inc'),
      key: 'planned_inc',
      dataIndex: 'next_planned_inc',
      render: (next_planned_inc) => {
        const showTime = next_planned_inc && next_planned_inc > 0;

        return <div>{showTime ? formatTimeUTC(next_planned_inc) : ''}</div>;
      },
    },
    {
      title: t('schedule:planned_full'),
      key: 'planned_full',
      dataIndex: 'next_planned_full',
      render: (next_planned_full) => {
        const showTime = next_planned_full && next_planned_full > 0;

        return <div>{showTime ? formatTimeUTC(next_planned_full) : ''}</div>;
      },
    },
    {
      title: t('schedule:reason'),
      key: 'reason',
      dataIndex: 'reason',
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
                              title={t('schedule:enable_schedule_confirm')}
                              onConfirm={() => enableScheduleMutation.mutate(record)}
                            >
                              {t('schedule:enable')}
                            </Popconfirm>
                          ),
                        },
                      ]
                    : [
                        {
                          key: 'disable',
                          label: (
                            <Popconfirm
                              title={t('schedule:disable_schedule_confirm')}
                              onConfirm={() => disableScheduleMutation.mutate(record)}
                            >
                              {t('schedule:disable')}
                            </Popconfirm>
                          ),
                        },
                      ]),
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        title={t('schedule:delete_schedule_confirm')}
                        description={t('schedule:delete_schedule_warning')}
                        onConfirm={() => deleteScheduleMutation.mutate(record)}
                      >
                        {t('common:delete')}
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
          <Form.Item name="origin_rsc" label={t('schedule:resource')}>
            <Input
              placeholder={t('schedule:resource')}
              value={searchResource}
              onChange={(e) => setSearchResource(e.target.value)}
              allowClear
            />
          </Form.Item>

          <Form.Item name="show_all" valuePropName="checked">
            <Checkbox onChange={(e) => setShowAll(e.target.checked)}>{t('schedule:show_all')}</Checkbox>
          </Form.Item>

          <Form.Item>
            <EnableScheduleForm onSuccess={refetch} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              onClick={() => {
                if (mode === UIMode.HCI) {
                  navigate('/hci/schedule/list');
                } else {
                  navigate('/schedule/list');
                }
              }}
            >
              {t('schedule:schedules')}
            </Button>
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
          showTotal: (total) => t('common:total_items', { total }),
        }}
        loading={isLoading}
        rowKey={(record) => record.rsc_name}
        expandable={{
          expandedRowRender,
          onExpand: handleExpand,
          expandedRowKeys,
        }}
      />
    </>
  );
};
