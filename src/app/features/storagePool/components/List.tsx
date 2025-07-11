// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, Space, Table, Tag, Select, Popconfirm, Input, Dropdown, Switch, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, MoreOutlined } from '@ant-design/icons';

import { useNodes } from '@app/features/node';
import { formatBytes } from '@app/utils/size';
import PropertyForm from '@app/components/PropertyForm';
import { GetStoragePoolQuery, StoragePool, UpdateStoragePoolRequestBody } from '../types';
import { deleteStoragePoolV2, getStoragePool, getStoragePoolCount, updateStoragePool } from '../api';

import { SearchForm } from './styled';
import { useTranslation } from 'react-i18next';
import { PropertyFormRef } from '@app/components/PropertyForm';
import { LiaToolsSolid } from 'react-icons/lia';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { UIMode } from '@app/models/setting';

export const List = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'storage_pool']);

  const { mode } = useSelector((state: RootState) => ({
    mode: state.setting.mode,
  }));
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

  const propertyFormRef = useRef<PropertyFormRef>(null);

  const [storagePoolListDisplay, setStoragePoolListDisplay] = useState<StoragePool[]>();
  const [current, setCurrent] = useState<StoragePool>();

  const show_default = Form.useWatch('show_default', form);

  const {
    data: storagePoolList,
    refetch,
    isLoading,
  } = useQuery(['getStoragePool', query], () => {
    return getStoragePool(query);
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
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

    navigate(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    navigate(mode === UIMode.HCI ? '/hci/inventory/storage-pools' : '/inventory/storage-pools');
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
      title: t('storage_pool:name'),
      key: 'name',
      dataIndex: 'storage_pool_name',
      sorter: (a, b) => {
        return a.storage_pool_name.localeCompare(b.storage_pool_name);
      },
      showSorterTooltip: false,
    },
    {
      title: t('storage_pool:node_name'),
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
              navigate(mode === UIMode.HCI ? `/hci/inventory/nodes/${node_name}` : `/inventory/nodes/${node_name}`);
            }}
          >
            {node_name}
          </Button>
        );
      },
      showSorterTooltip: false,
    },
    {
      title: t('storage_pool:provider_kind'),
      key: 'provider_kind',
      dataIndex: 'provider_kind',
      render: (provider_kind: string) => {
        const color = providerKindColorMap?.[provider_kind as keyof typeof providerKindColorMap] ?? 'default';
        return <Tag color={color}>{provider_kind}</Tag>;
      },
    },
    {
      title: t('storage_pool:disk'),
      key: 'disk',
      render: (_, sp) => {
        if (sp.provider_kind === 'DISKLESS') {
          return <span>N/A</span>;
        }
        return <span>{sp?.props?.['StorDriver/StorPoolName']}</span>;
      },
    },
    {
      title: t('storage_pool:free_capacity'),
      dataIndex: 'free_capacity',
      key: 'free_capacity',
      render: (free_capacity, sp) => {
        if (typeof free_capacity === 'undefined' || sp.provider_kind === 'DISKLESS') {
          return <span>N/A</span>;
        }
        return <span>{formatBytes(free_capacity)}</span>;
      },
    },
    {
      title: t('storage_pool:total_capacity'),
      dataIndex: 'total_capacity',
      key: 'total_capacity',
      render: (total_capacity, sp) => {
        if (typeof total_capacity === 'undefined' || sp.provider_kind === 'DISKLESS') {
          return <span>N/A</span>;
        }
        return <span>{formatBytes(total_capacity)}</span>;
      },
    },
    {
      title: t('storage_pool:supports_snapshots'),
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
      render: (_, record) => (
        <Space size="small">
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: t('common:edit'),
                  onClick: () =>
                    navigate(
                      mode === UIMode.HCI
                        ? `/hci/inventory/storage-pools/${record.node_name}/${record.storage_pool_name}/edit`
                        : `/inventory/storage-pools/${record.node_name}/${record.storage_pool_name}/edit`,
                    ),
                },
                {
                  key: 'delete',
                  label: (
                    <Popconfirm
                      key="delete"
                      title="Delete the storage pool"
                      description="Are you sure to delete this storage pool?"
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => handleDelete(record.node_name ?? '', record.storage_pool_name)}
                    >
                      {t('common:delete')}
                    </Popconfirm>
                  ),
                },
                {
                  key: 'property',
                  label: t('common:property'),
                  onClick: () => {
                    setCurrent(record);
                    propertyFormRef.current?.openModal();
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
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
          <Form.Item name="nodes" label={t('common:node')}>
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

          <Form.Item name="storage_pools" label={t('common:storage_pool')}>
            <Input placeholder="Storage Pool Name" />
          </Form.Item>

          <Form.Item label={t('storage_pool:show_default')} name="show_default" valuePropName="checked">
            <Switch />
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
              {hasSelected && (
                <Popconfirm
                  key="delete"
                  title="Delete storage pools"
                  description="Are you sure to delete selected storage pools?"
                  okText="Yes"
                  cancelText="No"
                  onConfirm={handleDeleteBulk}
                >
                  <Button danger>{t('common:delete')}</Button>
                </Popconfirm>
              )}
            </Space>
          </Form.Item>
        </Form>

        <Button
          type="primary"
          onClick={() =>
            navigate(mode === UIMode.HCI ? '/hci/inventory/storage-pools/create' : '/inventory/storage-pools/create')
          }
        >
          {t('common:add')}
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
        loading={isLoading || isStatsLoading}
      />

      <PropertyForm
        ref={propertyFormRef}
        initialVal={current?.props}
        type="storagepool"
        handleSubmit={(data) =>
          updateStoragePoolMutation.mutate({
            data,
            node: current?.node_name ?? '',
            storagepool: current?.storage_pool_name ?? '',
          })
        }
      />
    </>
  );
};
