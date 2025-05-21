// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useRef, useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import { UIMode } from '@app/models/setting';

import PropertyForm, { PropertyFormRef } from '@app/components/PropertyEditor';
import { getResourceGroups, getResourceGroupCount, deleteResourceGroup, updateResourceGroup } from '../api';
import { CreateResourceGroupRequestBody, ResourceGroupListQuery, UpdateResourceGroupRequestBody } from '../types';
import { SearchForm } from './styled';
import { SpawnForm } from './SpawnForm';
import { uniqId } from '@app/utils/stringUtils';
import { LiaToolsSolid } from 'react-icons/lia';

export const List = () => {
  const { t } = useTranslation(['resource_group', 'common']);
  const [current, setCurrent] = useState<CreateResourceGroupRequestBody>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const propertyFormRef = useRef<PropertyFormRef>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const { mode } = useSelector((state: RootState) => ({
    mode: state.setting.mode,
  }));

  const [query, setQuery] = useState<ResourceGroupListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const resource_groups = query.get('resource_groups')?.split(',');

    if (resource_groups) {
      form.setFieldValue('name', resource_groups);
    }

    return {
      limit: 10,
      offset: 0,
      resource_groups,
    };
  });

  const {
    data: resourceGroups,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['getResourceGroups', query],
    queryFn: () => getResourceGroups(query),
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['getResourceGroupCount'],
    queryFn: () => getResourceGroupCount(),
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();

    const newQuery: ResourceGroupListQuery = { ...query };

    if (values.name) {
      newQuery.resource_groups = [values.name];

      const query = new URLSearchParams({
        resource_groups: values.name,
      });

      const new_url = `${location.pathname}?${query.toString()}`;

      navigate(new_url);
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    navigate(
      mode === UIMode.HCI ? '/hci/storage-configuration/resource-groups' : '/storage-configuration/resource-groups',
    );
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const deleteMutation = useMutation({
    mutationKey: ['deleteResourceGroup'],
    mutationFn: (resource: string) => deleteResourceGroup(resource),
    onSuccess: () => {
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationKey: ['updateResourceGroup'],
    mutationFn: (data: UpdateResourceGroupRequestBody) => updateResourceGroup(current?.name ?? '', data as any),
    onSuccess: () => {
      refetch();
    },
  });

  const hasSelected = selectedRowKeys.length > 0;

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((ele) => {
      const resource = resourceGroups?.data?.find((e) => e.name === ele)?.name;

      if (resource) {
        deleteMutation.mutate(resource);
      }
    });
  };

  const edit = (resource_group?: string) => {
    navigate(
      mode === UIMode.HCI
        ? `/hci/storage-configuration/resource-groups/${resource_group}/edit`
        : `/storage-configuration/resource-groups/${resource_group}/edit`,
    );
  };

  const replicationMap = {
    A: t('async'),
    B: t('semi_sync'),
    C: t('sync'),
  };

  const columns: TableProps<CreateResourceGroupRequestBody>['columns'] = [
    {
      title: t('resource_group:name'),
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
      title: t('resource_group:place_count'),
      key: 'place_count',
      render: (_, item) => {
        return item?.select_filter?.place_count;
      },
      showSorterTooltip: false,
    },
    {
      title: t('resource_group:storage_pools'),
      key: 'Storage Pool(s)',
      render: (_, item) => {
        const sp = Array.isArray(item?.select_filter?.storage_pool_list)
          ? (item?.select_filter?.storage_pool_list ?? [])
          : [t('auto')];
        return (
          <>
            {sp.map((e) => (
              <Tag key={e}>{e}</Tag>
            ))}
          </>
        );
      },
    },
    {
      title: t('resource_group:replication'),
      key: 'Replication Mode',
      render: (_, item) => {
        const protocol = item?.props?.['DrbdOptions/Net/protocol'] as 'A' | 'B' | 'C' | undefined;
        if (protocol) {
          return <span>{replicationMap[protocol]}</span>;
        } else {
          return replicationMap['C'];
        }
      },
    },
    {
      title: t('resource_group:diskless'),
      key: 'state',
      align: 'center',
      render: (_, item) => {
        const state = item.select_filter?.diskless_on_remaining ? 'Yes' : 'No';
        return <Tag>{state}</Tag>;
      },
    },
    {
      title: t('resource_group:description'),
      key: 'description',
      dataIndex: 'description',
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
                  key: 'spawn',
                  label: <SpawnForm resource_group={record.name} isInDropdown={true} />,
                },
                {
                  key: 'edit',
                  label: t('common:edit'),
                  onClick: () => {
                    edit(record.name);
                  },
                },
                {
                  key: 'property',
                  label: t('common:property'),
                  onClick: () => {
                    setCurrent(record);
                    propertyFormRef.current?.openModal();
                  },
                },
                {
                  key: 'delete',
                  label: (
                    <Popconfirm
                      key="delete"
                      title="Delete the resource group"
                      description="Are you sure to delete this resource group?"
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => {
                        deleteMutation.mutate(record.name || '');
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
          <Form.Item name="name" label={t('resource_group:name')}>
            <Input placeholder="Name" />
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
                  title="Delete selected resource groups"
                  description="Are you sure to delete selected resource groups?"
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
            navigate(
              mode === UIMode.HCI
                ? '/hci/storage-configuration/resource-groups/create'
                : '/storage-configuration/resource-groups/create',
            )
          }
        >
          {t('common:add')}
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={resourceGroups?.data ?? []}
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
        loading={isLoading || isStatsLoading}
      />

      <PropertyForm
        ref={propertyFormRef}
        initialVal={current?.props}
        type="resource-definition"
        handleSubmit={(data) => updateMutation.mutate(data)}
      />
    </>
  );
};
