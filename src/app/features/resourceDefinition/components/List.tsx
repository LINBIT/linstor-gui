import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { DownOutlined } from '@ant-design/icons';

import PropertyForm from '@app/components/PropertyForm';
import {
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  getVolumeDefinitionListByResource,
} from '../api';
import { ResourceDefinition, ResourceDefinitionListQuery } from '../types';
import get from 'lodash.get';
import { SearchForm } from './styled';

export const List = () => {
  const [current, setCurrent] = useState<ResourceDefinition>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [query, setQuery] = useState<ResourceDefinitionListQuery>({
    limit: 10,
    offset: 0,
  });

  const history = useHistory();
  const [form] = Form.useForm();

  const { data: resourceDefinition, refetch } = useQuery({
    queryKey: ['getResourceDefinition', query],
    queryFn: () => getResourceDefinition(query),
    onSuccess: (data) => {
      data?.data?.forEach(async (item) => {
        if (item?.name) {
          const vd = await getVolumeDefinitionListByResource(item?.name);
          console.log(vd, 'vd');
        }
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['getResourceDefinitionCount'],
    queryFn: () => getResourceDefinitionCount(),
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();

    const newQuery: ResourceDefinitionListQuery = { ...query };

    if (values.name) {
      newQuery.resource_definitions = [values.name];
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const deleteMutation = useMutation({
    mutationKey: ['deleteResourceDefinition'],
    mutationFn: (resource: string) => deleteResourceDefinition(resource),
    onSuccess: () => {
      refetch();
    },
  });

  const hasSelected = selectedRowKeys.length > 0;

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((ele) => {
      const resource = resourceDefinition?.data?.find((e) => e.uuid === ele)?.name;

      if (resource) {
        deleteMutation.mutate(resource);
      }
    });
  };

  const columns: TableProps<ResourceDefinition>['columns'] = [
    {
      title: 'Name',
      key: 'name',
      dataIndex: 'name',
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
      title: 'Resource Group Name',
      key: 'resource_group_name',
      dataIndex: 'resource_group_name',
      sorter: (a, b) => {
        return (a?.resource_group_name ?? '').localeCompare(b?.resource_group_name ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: 'Port',
      key: 'Port',
      dataIndex: 'layer_data',
      render: (layer_data) => {
        const port = get(layer_data, '[0].data.port', '');
        return <span>{port}</span>;
      },
    },
    {
      title: 'State',
      key: 'state',
      render: (_, rd) => {
        const state = rd.flags?.find((flag) => flag === 'DELETE') != null ? 'DELETING' : 'OK';
        return <Tag color={state === 'DELETING' ? 'red' : 'green'}>{state}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="default" onClick={() => console.log()}>
            Deploy
          </Button>

          <Popconfirm
            key="delete"
            title="Delete the storage pool"
            description="Are you sure to delete this storage pool?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => console.log()}
          >
            <Button danger>Delete</Button>
          </Popconfirm>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: 'Edit',
                  onClick: () => {
                    setCurrent(record);
                    setPropertyModalOpen(true);
                  },
                },
                {
                  key: 'property',
                  label: 'Properties',
                  onClick: () => {
                    setCurrent(record);
                    setPropertyModalOpen(true);
                  },
                },
              ],
            }}
          >
            <DownOutlined rev={null} />
          </Dropdown>
        </Space>
      ),
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
          <Form.Item name="name" label="Name">
            <Input placeholder="Resource Definition Name" />
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
              {hasSelected && (
                <Popconfirm
                  key="delete"
                  title="Delete storage pools"
                  description="Are you sure to delete selected storage pools?"
                  okText="Yes"
                  cancelText="No"
                  onConfirm={handleDeleteBulk}
                >
                  <Button danger>Delete</Button>
                </Popconfirm>
              )}
            </Space>
          </Form.Item>
        </Form>

        <Button type="primary" onClick={() => history.push('/storage-configuration/resource-definitions/create')}>
          Add
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={resourceDefinition?.data ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid || ''}
        pagination={{
          total: stats?.data?.count ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          defaultCurrent: (query?.offset ?? 0) + 1,
          pageSize: query?.limit,
          onChange(page, pageSize) {
            setQuery({
              ...query,
              limit: pageSize,
              offset: (page - 1) * pageSize,
            });
          },
        }}
      />

      <PropertyForm
        initialVal={current?.props}
        openStatus={propertyModalOpen}
        type="resource-definition"
        handleSubmit={(data) => console.log()}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
