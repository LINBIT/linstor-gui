// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Space, Table, Tag, Dropdown } from 'antd';
import { Select } from '@app/components/Select';
import { Input } from '@app/components/Input';
import { RegexFilterHint } from '@app/components/RegexFilterHint';
import type { TableProps } from 'antd';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreOutlined } from '@ant-design/icons';

import Button from '@app/components/Button';
import { Link } from '@app/components/Link';
import { Switch } from '@app/components/Switch';
import { SupportStatus } from '@app/components/SupportStatus';

import { useNodes } from '@app/features/node';
import { formatBytes } from '@app/utils/size';
import PropertyForm from '@app/components/PropertyForm';
import { GetStoragePoolQuery, StoragePool, UpdateStoragePoolRequestBody } from '../types';
import { deleteStoragePoolV2, getStoragePool, getStoragePoolCount, updateStoragePool } from '../api';

import { SearchForm } from './styled';
import { useTranslation } from 'react-i18next';
import { PropertyFormRef } from '@app/components/PropertyForm';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';
import { Popconfirm } from '@app/components/Popconfirm';
import { useDeleteAction, deletingRowClass } from '@app/hooks/useDeleteAction';
import { labelRowCheckbox } from '@app/utils/rowSelection';
import { ActionColumnTitle } from '@app/components/ActionColumnTitle';

export const List = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'storage_pool']);

  const mode = useUIMode();
  const [query, setQuery] = useState<GetStoragePoolQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes');
    const queryO: GetStoragePoolQuery = {};

    if (nodes) {
      form.setFieldValue('nodes', nodes);
      queryO['nodes'] = [nodes];
    }

    // A link may name several pools (one param each); keep them apart, since
    // the controller matches each value as a whole name.
    const storage_pools = query.getAll('storage_pools').filter(Boolean);

    if (storage_pools.length > 0) {
      form.setFieldValue('storage_pools', storage_pools.join(', '));
      queryO['storage_pools'] = storage_pools;
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

  const [current, setCurrent] = useState<StoragePool>();

  const show_default = Form.useWatch('show_default', form);

  const {
    data: storagePoolList,
    refetch,
    isPending,
  } = useQuery({
    queryKey: ['getStoragePool', query, show_default],

    queryFn: () => {
      // If show_default is false, fetch more data to compensate for filtering
      const adjustedQuery = { ...query };
      if (!show_default && query?.limit) {
        // Fetch extra records to account for filtered default storage pools
        adjustedQuery.limit = Math.min(query.limit + 5, 100); // Add buffer, cap at 100
      }
      return getStoragePool(adjustedQuery);
    },
    // Another page or filter keeps the current rows until its own arrive.
    placeholderData: keepPreviousData,
  });

  const { data: stats, isPending: isStatsLoading } = useQuery({
    queryKey: ['getStoragePoolCount'],
    queryFn: () => getStoragePoolCount(),
  });

  // Get count of default storage pools that actually exist
  const { data: defaultStoragePoolList, isPending: isDefaultStatsLoading } = useQuery({
    queryKey: ['getDefaultStoragePools'],
    queryFn: () => getStoragePool({ storage_pools: ['DfltDisklessStorPool'] }),
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

  const storagePoolListDisplay = useMemo(() => {
    const rows = show_default
      ? storagePoolList?.data
      : storagePoolList?.data?.filter((e) => e.storage_pool_name !== 'DfltDisklessStorPool');
    // The fetch asks for extra rows without the default pools; show one page.
    return rows && query?.limit ? rows.slice(0, query.limit) : rows;
  }, [show_default, storagePoolList?.data, query?.limit]);
  // The pagination waits for the first page of rows: shown from the count
  // alone, it sat under the empty table and jumped down when the rows came.
  const listLoaded = storagePoolList !== undefined;

  // Handle show_default change: reset pagination when show_default changes
  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      offset: 0, // Reset to first page when show_default changes
    }));
  }, [show_default]);

  const del = useDeleteAction<StoragePool>({
    remove: (sp) => deleteStoragePoolV2({ node: sp.node_name ?? '', storagepool: sp.storage_pool_name }),
    keyOf: (sp) => sp.uuid || '',
    nameOf: (sp) => `${sp.node_name ?? ''}/${sp.storage_pool_name}`,
    refresh: () => refetch(),
  });

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: labelRowCheckbox((pool: StoragePool) => `${pool.storage_pool_name} ${pool.node_name}`),
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
    if (values.storage_pools && values.storage_pools !== (query?.storage_pools ?? []).join(', ')) {
      newQuery.storage_pools = values.storage_pools;
      queryS.set('storage_pools', values.storage_pools);
    } else if (values.storage_pools) {
      // The field still shows the pools a link filtered on; search them again
      // as they were rather than as one "a, b" name.
      newQuery.storage_pools?.forEach((pool) => queryS.append('storage_pools', pool));
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

  const handleDeleteBulk = async () => {
    const selected = (storagePoolListDisplay ?? []).filter((sp) => selectedRowKeys.includes(sp.uuid || ''));
    await del.run(selected);
    setSelectedRowKeys([]);
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
      ellipsis: true,
      dataIndex: 'storage_pool_name',
      sorter: (a, b) => {
        return a.storage_pool_name.localeCompare(b.storage_pool_name);
      },
      showSorterTooltip: false,
    },
    {
      title: t('storage_pool:node_name'),
      key: 'node_name',
      width: 108,
      dataIndex: 'node_name',
      sorter: (a, b) => {
        return (a?.node_name ?? '').localeCompare(b?.node_name ?? '');
      },
      render: (node_name) => {
        const nodeUrl = mode === UIMode.HCI ? `/hci/inventory/nodes/${node_name}` : `/inventory/nodes/${node_name}`;

        return <Link to={nodeUrl}>{node_name}</Link>;
      },
      showSorterTooltip: false,
    },
    {
      title: t('storage_pool:provider_kind'),
      key: 'provider_kind',
      width: 115,
      dataIndex: 'provider_kind',
      render: (provider_kind: string) => {
        const color = providerKindColorMap?.[provider_kind as keyof typeof providerKindColorMap] ?? 'default';
        return <Tag color={color}>{provider_kind}</Tag>;
      },
    },
    {
      title: t('storage_pool:disk'),
      key: 'disk',
      width: 111,
      ellipsis: true,
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
      width: 106,
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
      width: 108,
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
      width: 136,
      render: (supports_snapshots) => {
        return <SupportStatus supported={supports_snapshots} />;
      },
      align: 'center',
    },
    {
      title: () => <ActionColumnTitle />,
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
                      title={t('storage_pool:delete_storage_pool')}
                      description={t('storage_pool:are_you_sure_delete_storage_pool')}
                      onConfirm={() => del.run([record])}
                    >
                      <div className="w-full text-red-600">{t('common:delete')}</div>
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
            <span className="cursor-pointer text-gray-600 hover:text-gray-800 flex items-center justify-center w-8 h-8">
              <MoreOutlined style={{ fontSize: 18 }} />
            </span>
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
              placeholder={t('error_report:please_select_node')}
              options={nodes?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="storage_pools" label={t('common:storage_pool')}>
            <Input placeholder={t('storage_pool:storage_pool_name')} suffix={<RegexFilterHint />} />
          </Form.Item>

          <Form.Item label={t('storage_pool:show_default')} name="show_default" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button
                type="primary"
                onClick={() => {
                  handleSearch();
                }}
              >
                {t('common:search')}
              </Button>

              <Button type="secondary" onClick={handleReset}>
                {t('common:reset')}
              </Button>

              <Popconfirm
                key="delete"
                title={t('storage_pool:delete_storage_pools')}
                description={t('storage_pool:are_you_sure_delete_selected_storage')}
                onConfirm={handleDeleteBulk}
                disabled={!hasSelected}
              >
                <Button danger disabled={!hasSelected} loading={del.busy} className="!font-semibold">
                  {t('common:delete')}
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
        </Form>

        <Link
          type="primary"
          to={mode === UIMode.HCI ? '/hci/inventory/storage-pools/create' : '/inventory/storage-pools/create'}
        >
          + {t('common:add')}
        </Link>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={storagePoolListDisplay ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid || ''}
        rowClassName={(item) => (del.isDeleting(item.uuid || '') ? deletingRowClass : '')}
        // Fixed widths (what the auto layout settled on with rows): measured
        // from the content, the columns re-laid out when the rows arrived and
        // the wrapped header grew, shifting the page.
        tableLayout="fixed"
        pagination={
          listLoaded && {
            total: show_default
              ? (stats?.data?.count ?? 0)
              : (stats?.data?.count ?? 0) - (defaultStoragePoolList?.data?.length ?? 0), // Subtract actual count of default SPs
            showSizeChanger: true,
            showTotal: (total) => t('common:total_items', { total }),
            current: Math.floor((query?.offset ?? 0) / (query?.limit ?? 10)) + 1,
            pageSize: query?.limit,
            onChange(page, pageSize) {
              setQuery({
                ...query,
                limit: pageSize,
                offset: (page - 1) * pageSize,
              });
            },
          }
        }
        loading={isPending || isStatsLoading || isDefaultStatsLoading}
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
