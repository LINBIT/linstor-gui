// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { Button, Form, Space, Table, Tag, Select, Popconfirm, Input, Checkbox, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined } from '@ant-design/icons';

import { useNodes } from '@app/features/node';
import { formatBytes } from '@app/utils/size';
import PropertyForm from '@app/components/PropertyForm';
import { GetStoragePoolQuery, StoragePool, UpdateStoragePoolRequestBody } from '../types';
import { deleteStoragePoolV2, getStoragePool, getStoragePoolCount, updateStoragePool } from '../api';

import { SearchForm } from './styled';

export const List = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const [query, setQuery] = useState<GetStoragePoolQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes');
    const queryO: GetStoragePoolQuery = {};

    if (nodes) {
      form.setFieldValue('nodes', nodes);
      queryO['nodes'] = [nodes];
    }

    const storage_pools = query.get('storage_pools');

    if (storage_pools) {
      form.setFieldValue('storage_pools', storage_pools);
      queryO['storage_pools'] = [storage_pools];
    }

    return {
      limit: 10,
      offset: 0,
      ...queryO,
    };
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const nodes = useNodes();

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const [storagePoolListDisplay, setStoragePoolListDisplay] = useState<StoragePool[]>();
  const [current, setCurrent] = useState<StoragePool>();

  const show_default = Form.useWatch('show_default', form);

  const { data: storagePoolList, refetch } = useQuery(['getStoragePool', query], () => {
    return getStoragePool(query);
  });

  const { data: stats } = useQuery({
    queryKey: ['getStoragePoolCount'],
    queryFn: () => getStoragePoolCount(),
  });

  const updateStoragePoolMutation = useMutation({
    mutationFn: ({
      node,
      storagepool,
      data,
    }: {
      data: UpdateStoragePoolRequestBody;
      node: string;
      storagepool: string;
    }) => updateStoragePool({ node, storagepool }, data),
  });

  useEffect(() => {
    let displayData = storagePoolList?.data;

    if (!show_default) {
      displayData = storagePoolList?.data?.filter((e) => e.storage_pool_name !== 'DfltDisklessStorPool');
    }

    setStoragePoolListDisplay(displayData);
  }, [show_default, storagePoolList?.data]);

  const deleteMutation = useMutation({
    mutationFn: ({ node, storagepool }: { node: string; storagepool: string }) => {
      return deleteStoragePoolV2({ node, storagepool });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: GetStoragePoolQuery = { ...query };
    if (values.nodes) {
      newQuery.nodes = values.nodes;
      queryS.set('nodes', values.nodes);
    }
    if (values.storage_pools) {
      newQuery.storage_pools = values.storage_pools;
      queryS.set('storage_pools', values.storage_pools);
    }

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    history.push(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    history.push('/inventory/storage-pools');
  };

  const handleDelete = (node: string, storagepool: string) => {
    deleteMutation.mutate({ node, storagepool });
  };

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((ele) => {
      const currentSP = storagePoolListDisplay?.find((e) => e.uuid === ele);

      const node = currentSP?.node_name ?? '';
      const storagepool = currentSP?.storage_pool_name ?? '';

      deleteMutation.mutate({
        node,
        storagepool,
      });
    });
  };

  const providerKindColorMap = {
    LVM: 'orange',
    ZFS: 'blue',
    LVM_THIN: 'green',
    ZFS_THIN: 'purple',
    DISKLESS: '',
  };

  const columns: TableProps<StoragePool>['columns'] = [
    {
      title: 'Name',
      key: 'name',
      dataIndex: 'storage_pool_name',
      sorter: (a, b) => {
        return a.storage_pool_name.localeCompare(b.storage_pool_name);
      },
      showSorterTooltip: false,
    },
    {
      title: 'Node Name',
      key: 'node_name',
      dataIndex: 'node_name',
      sorter: (a, b) => {
        return (a?.node_name ?? '').localeCompare(b?.node_name ?? '');
      },
      render: (node_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/inventory/nodes/${node_name}`);
            }}
          >
            {node_name}
          </Button>
        );
      },
      showSorterTooltip: false,
    },
    {
      title: 'Provider Kind',
      key: 'provider_kind',
      dataIndex: 'provider_kind',
      render: (provider_kind) => {
        const color = providerKindColorMap[provider_kind] ?? 'default';
        return <Tag color={color}>{provider_kind}</Tag>;
      },
    },
    {
      title: 'Disk',
      key: 'disk',
      render: (_, sp) => {
        if (sp.provider_kind === 'DISKLESS') {
          return <span>N/A</span>;
        }
        return <span>{sp?.props?.['StorDriver/StorPoolName']}</span>;
      },
    },
    {
      title: 'Free Capacity',
      dataIndex: 'free_capacity',
      key: 'free_capacity',
      render: (free_capacity, sp) => {
        if (typeof free_capacity === "undefined" || sp.provider_kind === 'DISKLESS') {
          return <span>N/A</span>;
        }
        return <span>{formatBytes(free_capacity)}</span>;
      },
    },
    {
      title: 'Total Capacity',
      dataIndex: 'total_capacity',
      key: 'total_capacity',
      render: (total_capacity, sp) => {
        if (typeof total_capacity === "undefined" || sp.provider_kind === 'DISKLESS') {
          return <span>N/A</span>;
        }
        return <span>{formatBytes(total_capacity)}</span>;
      },
    },
    {
      title: 'Supports snapshots',
      dataIndex: 'supports_snapshots',
      key: 'supports_snapshots',
      render: (supports_snapshots) => {
        return (
          <span>
            {supports_snapshots ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '24px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '24px' }} />
            )}
          </span>
        );
      },
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            onClick={() =>
              history.push(`/inventory/storage-pools/${record.node_name}/${record.storage_pool_name}/edit`)
            }
          >
            Edit
          </Button>
          <Popconfirm
            key="delete"
            title="Delete the storage pool"
            description="Are you sure to delete this storage pool?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.node_name ?? '', record.storage_pool_name)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>

          <Dropdown
            menu={{
              items: [
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
          <Form.Item name="nodes" label="Node">
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Please select node"
              options={nodes?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="storage_pools" label="Storage Pool">
            <Input placeholder="Storage Pool Name" />
          </Form.Item>

          <Form.Item label="Default Storage Pool" name="show_default" valuePropName="checked">
            <Checkbox>Show</Checkbox>
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

        <Button type="primary" onClick={() => history.push('/inventory/storage-pools/create')}>
          Add
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={storagePoolListDisplay ?? []}
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
        type="storagepool"
        handleSubmit={(data) =>
          updateStoragePoolMutation.mutate({
            data,
            node: current?.node_name ?? '',
            storagepool: current?.storage_pool_name ?? '',
          })
        }
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
