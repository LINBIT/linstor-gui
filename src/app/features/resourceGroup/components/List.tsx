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

import PropertyForm, { PropertyFormRef } from '@app/components/PropertyForm';
import { getResourceGroups, getResourceGroupCount, deleteResourceGroup, updateResourceGroup } from '../api';
import { CreateResourceGroupRequestBody, ResourceGroupListQuery, UpdateResourceGroupRequestBody } from '../types';
import { SearchForm } from './styled';
import { SpawnForm } from './SpawnForm';
import { uniqId } from '@app/utils/stringUtils';
import { LiaToolsSolid } from 'react-icons/lia';

export const List = () => {
  const { t } = useTranslation(['resource_group', 'common']);
  const [current, setCurrent] = useState<CreateResourceGroupRequestBody>();
  const [currentProps, setCurrentProps] = useState<Record<string, unknown> | undefined>();
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

  const columns: TableProps<CreateResourceGroupRequestBody>['columns'] = [
    {
      title: t('resource_group:name'),
      key: 'name',
      dataIndex: 'name',
      width: 150,
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
      width: 100,
      render: (_, item) => {
        return item?.select_filter?.place_count;
      },
      showSorterTooltip: false,
    },
    {
      title: t('resource_group:auto_select_filter'),
      key: 'auto_select_filter',
      width: 200,
      render: (_, item) => {
        const filter = item?.select_filter;
        if (!filter) return null;

        // Filter out place_count and storage pool related fields
        const filteredEntries = Object.entries(filter).filter(([key, value]) => {
          return (
            key !== 'place_count' &&
            key !== 'storage_pool' &&
            value != null &&
            value !== '' &&
            !(Array.isArray(value) && value.length === 0)
          );
        });

        if (filteredEntries.length === 0) return null;

        const filterTexts = filteredEntries.map(([key, value], index) => {
          // Truncate key name if too long
          const displayKey = key;

          if (key === 'storage_pool_list' && Array.isArray(value) && value.length > 0) {
            const storagePoolsParam = value.join(',');
            const url =
              mode === UIMode.HCI
                ? `/hci/inventory/storage-pools?storage_pools=${storagePoolsParam}`
                : `/inventory/storage-pools?storage_pools=${storagePoolsParam}`;

            return (
              <div key={index}>
                {displayKey}:{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(url);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {value.join(', ')}
                </a>
              </div>
            );
          }

          let displayValue: string;
          if (Array.isArray(value)) {
            displayValue = value.join(', ');
          } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value);
          } else {
            displayValue = String(value);
          }

          return (
            <div key={index}>
              {displayKey}: {displayValue}
            </div>
          );
        });

        const fullText = filteredEntries
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            } else if (typeof value === 'object') {
              return `${key}: ${JSON.stringify(value)}`;
            } else {
              return `${key}: ${value}`;
            }
          })
          .join('\n');

        return (
          <Tooltip title={fullText} placement="top">
            <div>{filterTexts}</div>
          </Tooltip>
        );
      },
    },
    {
      title: t('resource_group:properties'),
      key: 'properties',
      width: 200,
      render: (_, item) => {
        const props = item?.props;
        if (!props || Object.keys(props).length === 0) return null;

        const propEntries = Object.entries(props).filter(([, value]) => {
          return value != null && value !== '';
        });

        if (propEntries.length === 0) return null;

        const propTexts = propEntries.map(([key, value]) => {
          // Truncate property name if longer than 15 characters
          const displayKey = key.length > 15 ? `${key.substring(0, 15)}...` : key;

          if (Array.isArray(value)) {
            return `${displayKey}: ${value.join(', ')}`;
          } else if (typeof value === 'object') {
            return `${displayKey}: ${JSON.stringify(value)}`;
          } else {
            return `${displayKey}: ${value}`;
          }
        });

        const fullText = propEntries
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            } else if (typeof value === 'object') {
              return `${key}: ${JSON.stringify(value)}`;
            } else {
              return `${key}: ${value}`;
            }
          })
          .join('\n');

        return (
          <Tooltip title={fullText} placement="top">
            <div>
              {propTexts.map((text, index) => (
                <div key={index}>{text}</div>
              ))}
            </div>
          </Tooltip>
        );
      },
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
      width: 20,
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
                    setCurrentProps(record.props);
                    setTimeout(() => {
                      propertyFormRef.current?.openModal();
                    }, 0);
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
              <Popconfirm
                key="delete"
                title="Delete selected resource groups"
                description="Are you sure to delete selected resource groups?"
                okText="Yes"
                cancelText="No"
                onConfirm={handleDeleteBulk}
              >
                <Button danger disabled={!hasSelected}>
                  {t('common:delete')}
                </Button>
              </Popconfirm>
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
        initialVal={currentProps}
        type="resource-definition"
        handleSubmit={(data) => updateMutation.mutate(data)}
      />
    </>
  );
};
