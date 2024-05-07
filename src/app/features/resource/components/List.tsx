import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import PropertyForm from '@app/components/PropertyForm';
import { getResources, getResourceCount, deleteResource, resourceModify } from '../api';
import { SearchForm } from './styled';
import { uniqId } from '@app/utils/stringUtils';
import { ResourceDataType, ResourceListQuery, ResourceModifyRequestBody } from '../types';
import { omit } from '@app/utils/object';

export const List = () => {
  const { t } = useTranslation(['resource_group', 'common']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState<ResourceDataType>();

  const [query, setQuery] = useState<ResourceListQuery>({
    limit: 10,
    offset: 0,
  });

  const history = useHistory();
  const [form] = Form.useForm();

  const { data: resources, refetch } = useQuery({
    queryKey: ['getResources', query],
    queryFn: () => getResources(query),
  });

  const { data: stats } = useQuery({
    queryKey: ['getResourceCount'],
    queryFn: () => getResourceCount(),
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();

    const newQuery: ResourceListQuery = { ...query };

    if (values.name) {
      newQuery.resources = [values.name];
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({
      limit: 10,
      offset: 0,
    });
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const deleteMutation = useMutation({
    mutationKey: ['deleteResource'],
    mutationFn: (node: string) => deleteResource(node),
    onSuccess: () => {
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationKey: ['resourceModify'],
    mutationFn: (data: ResourceModifyRequestBody) =>
      resourceModify({
        node: current?.name ?? '',
        body: data,
      }),
    onSuccess: () => {
      refetch();
    },
  });

  const hasSelected = selectedRowKeys.length > 0;

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((ele) => {
      deleteMutation.mutate(String(ele));
    });
  };

  const columns: TableProps<ResourceDataType>['columns'] = [
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
      title: 'Node',
      key: 'node_name',
      dataIndex: 'node_name',
    },
    {
      title: 'Port',
      key: 'port',
      render: (_, item) => {
        return item?.net_interfaces?.find((e) => e.is_active)?.satellite_port ?? '';
      },
    },
    {
      title: 'Type',
      key: 'type',
      dataIndex: 'type',
      render: (type) => {
        return <Tag>{type}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, item) => {
        const connected = item.connection_status === 'CONNECTED' || item.connection_status === 'ONLINE';
        return (
          <>
            {connected ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}

            <span style={{ marginLeft: 4 }}>{item.connection_status}</span>
          </>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            onClick={() => {
              history.push(`/inventory/resources/${record.name}`);
            }}
          >
            View
          </Button>

          <Popconfirm
            key="delete"
            title="Delete the node"
            description="Are you sure to delete this node?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              deleteMutation.mutate(record.name || '');
            }}
          >
            <Button danger loading={deleteMutation.isLoading}>
              Delete
            </Button>
          </Popconfirm>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: 'Edit',
                  onClick: () => {
                    history.push(`/inventory/resources/edit/${record.name}`);
                  },
                },
                {
                  key: 'property',
                  label: 'Properties',
                  onClick: () => {
                    setCurrent(record);
                    const currentData = omit(record.props ?? {}, 'CurStltConnName');
                    setInitialProps({
                      ...currentData,
                      name: record.name,
                    });
                    setPropertyModalOpen(true);
                  },
                },
              ],
            }}
          >
            <DownOutlined />
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
            <Input placeholder="Name" />
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

        <Button type="primary" onClick={() => history.push('/inventory/resources/create')}>
          Add
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={resources?.data ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.name ?? uniqId()}
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
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="node"
        handleSubmit={(data) => updateMutation.mutate(data)}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
