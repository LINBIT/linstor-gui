// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreOutlined } from '@ant-design/icons';

import PropertyForm from '@app/components/PropertyForm';
import {
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  updateResourceDefinition,
} from '../api';
import { ResourceDefinition, ResourceDefinitionListQuery, UpdateResourceDefinitionRequestBody } from '../types';
import { SearchForm } from './styled';
import { SpawnForm } from './SpawnForm';
import { uniqId } from '@app/utils/stringUtils';
import { omit } from '@app/utils/object';
import { useTranslation } from 'react-i18next';

export const List = () => {
  const [current, setCurrent] = useState<ResourceDefinition>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { t } = useTranslation(['common', 'resource_definitions']);

  const [query, setQuery] = useState<ResourceDefinitionListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const resource_definitions = query.get('resource_definitions')?.split(',');

    if (resource_definitions) {
      form.setFieldValue('name', resource_definitions);
    }

    return {
      limit: 10,
      offset: 0,
      resource_definitions,
    };
  });

  const { data: resourceDefinition, refetch } = useQuery({
    queryKey: ['getResourceDefinition', query],
    queryFn: () => getResourceDefinition(query),
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

      const query = new URLSearchParams({
        resource_definitions: values.name,
      });

      const new_url = `${location.pathname}?${query.toString()}`;

      navigate(new_url);
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    navigate('/storage-configuration/resource-definitions');
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

  const updateMutation = useMutation({
    mutationKey: ['updateResourceDefinition'],
    mutationFn: (data: UpdateResourceDefinitionRequestBody) =>
      updateResourceDefinition(current?.name ?? '', data as any),
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

  const edit = (resourceDefinitionName?: string) => {
    navigate(`/storage-configuration/resource-definitions/${resourceDefinitionName}/edit`);
  };

  const columns: TableProps<ResourceDefinition>['columns'] = [
    {
      title: t('resource_definition:name'),
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
      title: t('resource_definition:resource_group_name'),
      key: 'resource_group_name',
      dataIndex: 'resource_group_name',
      sorter: (a, b) => {
        return (a?.resource_group_name ?? '').localeCompare(b?.resource_group_name ?? '');
      },
      showSorterTooltip: false,
      render: (resource_group_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              navigate(`/storage-configuration/resource-groups?resource_groups=${resource_group_name}`);
            }}
          >
            {resource_group_name}
          </Button>
        );
      },
    },
    {
      title: t('common:port'),
      key: 'Port',
      dataIndex: 'layer_data',
      render: (layer_data) => {
        const port = layer_data?.[0]?.data?.port || '';
        return <span>{port}</span>;
      },
    },
    {
      title: t('common:state'),
      key: 'state',
      render: (_, rd) => {
        const state = rd.flags?.find((flag) => flag === 'DELETE') != null ? 'DELETING' : 'OK';
        return <Tag color={state === 'DELETING' ? 'red' : 'green'}>{state}</Tag>;
      },
    },
    {
      title: t('common:action'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <SpawnForm resource={record.name} />

          <Popconfirm
            key="delete"
            title="Delete the resource definition"
            description="Are you sure to delete this resource definition?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              deleteMutation.mutate(record.name || '');
            }}
          >
            <Button danger>{t('common:delete')}</Button>
          </Popconfirm>

          <Dropdown
            menu={{
              items: [
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
                    setPropertyModalOpen(true);

                    const currentData = omit(
                      record.props ?? {},
                      'DrbdPrimarySetOn',
                      'NVMe/TRType',
                      'DrbdOptions/auto-verify-alg',
                    );
                    setInitialProps(currentData);
                    setPropertyModalOpen(true);
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
          <Form.Item name="name" label={t('resource_definition:name')}>
            <Input placeholder="Resource Definition Name" />
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
                  title="Delete resource definition"
                  description="Are you sure to delete selected resource definitions?"
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

        <Button type="primary" onClick={() => navigate('/storage-configuration/resource-definitions/create')}>
          {t('common:add')}
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={resourceDefinition?.data ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid ?? uniqId()}
        pagination={{
          total: stats?.data?.count ?? 0,
          showSizeChanger: true,
          showTotal: (total) => t('common:total_items', { total }),
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
        type="resource-definition"
        handleSubmit={(data) => updateMutation.mutate(data)}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
