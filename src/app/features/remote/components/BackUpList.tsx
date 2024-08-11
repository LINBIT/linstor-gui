import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Select, Popconfirm } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { deleteBackup, getBackup } from '../api';
import { SearchForm } from './styled';
import { formatTime } from '@app/utils/time';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { CreateBackupForm } from './CreateBackupForm';

type RemoteQuery = {
  name?: string | null;
  type?: string | null;
};

export const List = () => {
  const [dataList, setDataList] = useState<any[]>();

  const history = useHistory();
  const [form] = Form.useForm();
  const location = useLocation();

  const { remote_name } = useParams<{ remote_name: string }>();

  const [query, setQuery] = useState<RemoteQuery>(() => {
    const query = new URLSearchParams(location.search);
    const name = query.get('name');
    const type = query.get('type');

    const queryO: RemoteQuery = {};

    if (name) {
      form.setFieldValue('name', name);
      queryO['name'] = name;
    }

    if (type) {
      form.setFieldValue('type', type);
      queryO['type'] = type;
    }

    return {
      name,
      type,
    };
  });

  const { isLoading, refetch } = useQuery({
    queryKey: ['getBackup', query],
    queryFn: async () => {
      const res = await getBackup(remote_name);

      const list = Object.keys(res.data?.linstor || {}).map((key) => {
        const item = res.data?.linstor?.[key];

        return item;
      });

      setDataList(list);
    },
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: RemoteQuery = { ...query };

    if (values.name) {
      newQuery.name = values.name;
      queryS.set('name', values.name);
    }

    if (values.type) {
      newQuery.type = values.type;
      queryS.set('type', values.type);
    }

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    const newList = dataList?.filter((e) => {
      if (values.name && e.name !== values.name) {
        return false;
      }

      if (values.type && e.type !== values.type) {
        return false;
      }

      return true;
    });

    setDataList(newList);

    history.push(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});

    history.push(location.pathname);
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
      title: 'Action',
      key: 'action',
      render: (record, info) => {
        console.log(record, 'record');

        console.log(info, 'info');

        return (
          <Popconfirm
            title="Delete this backup?"
            onConfirm={() => {
              handleDelete(record.finished_time);
            }}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        );
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log(dataList, 'dataList');

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
          <Form.Item name="name" label="Name">
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item name="type" label="Type">
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Select type"
              options={[
                {
                  label: 'ebs',
                  value: 'ebs_remotes',
                },
                {
                  label: 'LINSTOR',
                  value: 'linstor_remotes',
                },
                {
                  label: 's3',
                  value: 's3_remotes',
                },
              ]}
            />
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
      />
    </>
  );
};
