// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Popconfirm, Dropdown, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleFilled, CloseCircleFilled, MoreOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';

import { deleteBackup, getBackup } from '../api';
import { SearchForm } from './styled';
import { formatTime } from '@app/utils/time';
import { CreateBackupForm } from './CreateBackupForm';

type RemoteQuery = {
  origin_rsc?: string | null;
};

export const List = () => {
  const [dataList, setDataList] = useState<any[]>();

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const location = useLocation();

  const { remote_name } = useParams<{ remote_name: string }>();

  const { t } = useTranslation(['remote', 'common']);

  const [query, setQuery] = useState<RemoteQuery>(() => {
    const query = new URLSearchParams(location.search);
    const origin_rsc = query.get('origin_rsc');

    const queryO: RemoteQuery = {};

    if (origin_rsc) {
      form.setFieldValue('origin_rsc', origin_rsc);
      queryO['origin_rsc'] = origin_rsc;
    }

    return {
      origin_rsc,
    };
  });

  const { isLoading, refetch } = useQuery({
    queryKey: ['getBackup', query],
    queryFn: async () => {
      const res = await getBackup(remote_name ?? '');

      let list = Object.keys(res.data?.linstor || {}).map((key) => {
        const item = res.data?.linstor?.[key];

        return item;
      });

      if (query.origin_rsc) {
        list = list.filter((e) => e?.origin_rsc === query.origin_rsc);
      }

      setDataList(list);
    },
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: RemoteQuery = { ...query };

    if (values.origin_rsc) {
      newQuery.origin_rsc = values.origin_rsc;
      queryS.set('origin_rsc', values.origin_rsc);
    }

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    const newList = dataList?.filter((e) => {
      if (values.origin_rsc && e.origin_rsc !== values.origin_rsc) {
        return false;
      }

      return true;
    });

    setDataList(newList);

    navigate(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});

    navigate(location.pathname);
  };

  const deleteRemoteMutation = useMutation({
    mutationFn: async (timestamp: string) => {
      try {
        await deleteBackup(remote_name, {
          timestamp,
        });

        refetch();
      } catch (error) {
        console.log(error);
      }
    },
  });

  const handleDelete = async (timestamp: string) => {
    deleteRemoteMutation.mutate(timestamp);
  };

  const columns: TableProps<{
    origin_rsc: string;
    origin_snap: string;
    finished_timestamp: number;
    success: boolean;
    finished_time: string;
  }>['columns'] = [
    {
      title: <span>Resource</span>,
      key: 'resource',
      dataIndex: 'origin_rsc',
      sorter: (a, b) => {
        if (a.origin_rsc && b.origin_rsc) {
          return a.origin_rsc.localeCompare(b.origin_rsc);
        } else {
          return 0;
        }
      },
      showSorterTooltip: false,
    },
    {
      title: 'Snapshot',
      key: 'snapshot',
      dataIndex: 'origin_snap',
    },
    {
      title: 'Finished At',
      key: 'finished_at',
      dataIndex: 'finished_timestamp',
      render: (finished_timestamp) => {
        return <span>{formatTime(finished_timestamp)}</span>;
      },
      sorter: (a, b) => {
        if (a.finished_timestamp && b.finished_timestamp) {
          return a.finished_timestamp - b.finished_timestamp;
        } else {
          return 0;
        }
      },
      showSorterTooltip: false,
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'success',
      render: (success) => {
        return (
          <div>
            {success ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}{' '}
            <span>{success ? 'Success' : 'Failed'}</span>
          </div>
        );
      },
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
                    key: 'delete',
                    label: (
                      <Popconfirm
                        title="Delete this backup?"
                        onConfirm={() => {
                          handleDelete(record.finished_time);
                        }}
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
          <Form.Item name="origin_rsc" label="Resource">
            <Input placeholder="Resource" />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button type="default" onClick={handleReset}>
                Reset
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleSearch();
                }}
              >
                Search
              </Button>
            </Space>
          </Form.Item>

          <Form.Item>
            <CreateBackupForm refetch={refetch} />
          </Form.Item>
        </Form>
      </SearchForm>

      <br />

      <Table
        columns={columns as any}
        dataSource={dataList ?? []}
        pagination={{
          total: dataList?.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        loading={isLoading}
      />
    </>
  );
};
