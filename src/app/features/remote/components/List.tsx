// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Select, Popconfirm } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { deleteRemote, getRemoteList } from '../api';
import { SearchForm } from './styled';
import { CreateRemoteForm } from './CreateRemoteForm';

type RemoteQuery = {
  name?: string | null;
  type?: string | null;
};

export const List = () => {
  const [dataList, setDataList] = useState<any[]>();

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const location = useLocation();

  const { t } = useTranslation(['remote', 'common']);

  const type = Form.useWatch('type', form);
  const name = Form.useWatch('name', form);

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
    queryKey: ['getRemotes', query],
    queryFn: async () => {
      const res = await getRemoteList();

      let list = Object.keys(res?.data || {})
        .map((key: string) => {
          const item = res?.data?.[key as 's3_remotes' | 'linstor_remotes' | 'ebs_remotes'] || [];

          return item.map((e) => ({
            ...e,
            type: key,
          }));
        })
        .flat();

      if (type) {
        list = list.filter((e) => e.type === type);
      }

      if (name) {
        list = list.filter((e) => e.remote_name === name);
      }

      setDataList(list);
    },
  });

  // s3_remotes linstor_remotes ebs_remotes

  // const s3_remotes = data?.data?.s3_remotes?.map((e) => ({
  //   name: e.remote_name,
  //   type: 'S3',
  //   // eu-central.http://192.168.123.123:9000/linstor
  //   info: `${e.region}.${e.endpoint}/${e.bucket}`,
  // }));

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

    navigate(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});

    navigate(location.pathname);
  };

  const deleteRemoteMutation = useMutation({
    mutationFn: async (remote_name: string) => {
      try {
        await deleteRemote(remote_name);

        refetch();
      } catch (error) {
        console.log(error);
      }
    },
  });

  const handleDelete = async (remote_name: string) => {
    deleteRemoteMutation.mutate(remote_name);
  };

  const columns: TableProps<{
    name: string;
    type: string;
    region: string;
    endpoint: string;
    bucket: string;
    url?: string;
  }>['columns'] = [
    {
      title: t('remote:name'),
      key: 'name',
      dataIndex: 'remote_name',
      sorter: (a, b) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name);
        } else {
          return 0;
        }
      },
      showSorterTooltip: false,
    },
    {
      title: t('remote:type'),
      key: 'type',
      dataIndex: 'type',
    },
    {
      title: t('remote:Info'),
      key: 'info',
      render: (record, info) => {
        if (record.type === 'linstor_remotes') {
          return <span>{`${info.url}`}</span>;
        }

        return <span>{`${info.region}.${info.endpoint}/${info.bucket}`}</span>;
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      render: (record, info) => {
        return (
          <Space>
            <Button
              onClick={() => {
                if (record.type === 's3_remotes') {
                  navigate(`/remote/${record.remote_name}/backups`);
                } else {
                  window.open(`${info.url}/ui/#!/storage-configuration/resources `);
                }
              }}
            >
              {t('remote:backups')}
            </Button>
            <Popconfirm
              title="Delete this remote object?"
              onConfirm={() => {
                handleDelete(record.remote_name);
              }}
            >
              <Button danger>{t('common:delete')}</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item name="type" label={t('remote:type')}>
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
                {t('common:reset')}
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleSearch();
                }}
              >
                {t('common:search')}
              </Button>
            </Space>
          </Form.Item>

          <Form.Item>
            <CreateRemoteForm refetch={refetch} />
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
