import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Select } from 'antd';
import type { TableProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';

import { getRemoteList } from '../api';
import { SearchForm } from './styled';
import { CreateRemoteForm } from './CreateRemoteForm';

type RemoteQuery = {
  name?: string | null;
  type?: string | null;
};

export const List = () => {
  const [dataList, setDataList] = useState<any[]>();

  const history = useHistory();
  const [form] = Form.useForm();
  const location = useLocation();

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

  const { isLoading } = useQuery({
    queryKey: ['getResources', query],
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

    console.log(newList, 'newList');

    setDataList(newList);

    // history.push(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});

    history.push(location.pathname);
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
      title: <span>Name</span>,
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
      title: 'Type',
      key: 'type',
      dataIndex: 'type',
    },
    {
      title: 'Info',
      key: 'info',
      render: (record, info) => {
        console.log(record, 'record');

        console.log(info, 'info');

        if (record.type === 'linstor_remotes') {
          return <span>{`${info.url}`}</span>;
        }

        return <span>{`${info.region}.${info.endpoint}/${info.bucket}`}</span>;
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
              placeholder="Please select node"
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
            <CreateRemoteForm />
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
