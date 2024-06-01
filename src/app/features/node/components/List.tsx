import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined } from '@ant-design/icons';

import PropertyForm from '@app/components/PropertyForm';
import { getNodes, getNodeCount, deleteNode, updateNode, lostNode } from '../api';
import { SearchForm } from './styled';
import { uniqId } from '@app/utils/stringUtils';
import { NodeDataType, NodeListQuery, UpdateNodeRequestBody } from '../types';
import { omit } from '@app/utils/object';

export const List = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState<NodeDataType>();

  const history = useHistory();
  const location = useLocation();

  const [form] = Form.useForm();

  const [query, setQuery] = useState<NodeListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes')?.split(',');

    if (nodes) {
      form.setFieldValue('name', nodes);
    }

    return {
      limit: 10,
      offset: 0,
      nodes,
    };
  });

  const { data: nodes, refetch } = useQuery({
    queryKey: ['getNodes', query],
    queryFn: () => getNodes(query),
  });

  const { data: stats } = useQuery({
    queryKey: ['getNodeCount'],
    queryFn: () => getNodeCount(),
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();

    const newQuery: NodeListQuery = { ...query };

    if (values.name) {
      newQuery.nodes = [values.name];

      const query = new URLSearchParams({
        nodes: values.name,
      });

      const new_url = `${location.pathname}?${query.toString()}`;

      history.push(new_url);
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    history.push('/inventory/nodes');
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const deleteMutation = useMutation({
    mutationKey: ['deleteNode'],
    mutationFn: (node: string) => deleteNode(node),
    onSuccess: () => {
      refetch();
    },
  });

  const lostMutation = useMutation({
    mutationKey: ['lostNode'],
    mutationFn: (node: string) => lostNode(node),
    onSuccess: () => {
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationKey: ['updateNode'],
    mutationFn: (data: UpdateNodeRequestBody) =>
      updateNode({
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

  const handleLostBulk = () => {
    selectedRowKeys.forEach((ele) => {
      lostMutation.mutate(String(ele));
    });
  };

  const columns: TableProps<NodeDataType>['columns'] = [
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
      title: 'IP',
      key: 'ip',
      render: (_, item) => {
        return item?.net_interfaces?.find((e) => e.is_active)?.address ?? '';
      },
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
              history.push(`/inventory/nodes/${record.name}`);
            }}
          >
            View
          </Button>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: 'Edit',
                  onClick: () => {
                    history.push(`/inventory/nodes/edit/${record.name}`);
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
                {
                  key: 'delete',
                  label: (
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
                      Delete
                    </Popconfirm>
                  ),
                },
                {
                  key: 'lost',
                  label: (
                    <Popconfirm
                      key="lost"
                      title="Lost the node"
                      description="Are you sure to lost this node?"
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => {
                        lostMutation.mutate(record.name || '');
                      }}
                    >
                      Lost
                    </Popconfirm>
                  ),
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
          name="node_list_form"
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
                <>
                  <Popconfirm
                    key="delete"
                    title="Delete nodes"
                    description="Are you sure to delete selected nodes?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={handleDeleteBulk}
                  >
                    <Button danger>Delete</Button>
                  </Popconfirm>

                  <Popconfirm
                    key="lost"
                    title="Lost nodes"
                    description="Are you sure to lost the selected nodes?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={handleLostBulk}
                  >
                    <Button type="primary" danger>
                      Lost
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>

        <Button type="primary" onClick={() => history.push('/inventory/nodes/create')}>
          Add
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={nodes?.data ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid ?? uniqId()}
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
