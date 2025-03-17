// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Popconfirm, Select } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PropertyForm from '@app/components/PropertyEditor';
import {
  getResourceDefinition,
  deleteVolumeDefinition,
  getVolumeDefinitionListByResource,
  updateResourceDefinition,
} from '../api';
import {
  ResourceDefinition,
  ResourceDefinitionListQuery,
  UpdateResourceDefinitionRequestBody,
  VolumeDefinition,
} from '../types';
import { SearchForm } from './styled';
import { formatBytes } from '@app/utils/size';
import { CreateForm } from './CreateForm';

export const List = () => {
  const [current, setCurrent] = useState<ResourceDefinition>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const { t } = useTranslation(['volume_definition', 'common']);

  const navigate = useNavigate();
  const location = useLocation();

  const [form] = Form.useForm();

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

  const {
    data: resourceDefinition,
    refetch,
    isLoading: rdIsLoading,
  } = useQuery({
    queryKey: ['getResourceDefinition', query],
    queryFn: () => getResourceDefinition(query),
  });

  const vdList = useQueries({
    queries: resourceDefinition
      ? (resourceDefinition?.data?.map(({ name, resource_group_name }) => {
          return {
            queryKey: ['getVolumeDefinitionListByResource', name],
            queryFn: () => getVolumeDefinitionListByResource(name || ''),
            enabled: !!name,
            onSuccess: (data) => {
              const rdName = name;
              const vdList = data.data;
              // add rdName to vdList
              vdList.forEach((vd) => {
                vd.rdName = rdName;
                vd.rgName = resource_group_name;
              });

              return vdList;
            },
          };
        }) ?? [])
      : [],
  });

  const vdListDisplay = vdList.map((e) => e.data?.data).flat();

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
    navigate('/storage-configuration/volume-definitions');
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const deleteMutation = useMutation({
    mutationKey: ['deleteVolumeDefinition'],
    mutationFn: (data: { resource: string; volume: number }) => deleteVolumeDefinition(data.resource, data.volume),
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
      const resource = vdListDisplay.find((e) => e?.uuid === ele) as any;

      if (resource) {
        deleteMutation.mutate({
          resource: resource.rdName,
          volume: Number(resource.volume_number),
        });
      }
    });
  };

  const columns: TableProps<
    VolumeDefinition & {
      rdName: string;
      rgName: string;
    }
  >['columns'] = [
    {
      title: t('common:resource_definition'),
      key: 'rdName',
      dataIndex: 'rdName',
      sorter: (a, b) => {
        if (a.rdName && b.rdName) {
          return a.rdName.localeCompare(b.rdName);
        } else {
          return 0;
        }
      },
      showSorterTooltip: false,
    },
    {
      title: t('common:volume_number'),
      key: 'volume_number',
      dataIndex: 'volume_number',
    },
    {
      title: t('common:size'),
      key: 'Size',
      dataIndex: 'size_kib',
      render: (size_kib) => {
        return <span>{formatBytes(size_kib)}</span>;
      },
    },
  ];

  const isLoading = vdList.some((e) => e.isLoading) || rdIsLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
          <Form.Item name="name" label={t('common:resource_definition')}>
            <Select
              showSearch
              style={{ width: 200 }}
              options={
                resourceDefinition?.data?.map((e) => ({
                  label: e.name,
                  value: e.name,
                })) || []
              }
              placeholder="Select a resource definition"
            />
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
                  title="Delete volume definition?"
                  description="Are you sure to delete selected volume definition?"
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

        <CreateForm refetch={refetch} />
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={vdListDisplay ?? []}
        rowSelection={rowSelection}
        rowKey={(record) => record.uuid}
        loading={isLoading}
        pagination={{
          total: vdListDisplay.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          defaultCurrent: (query?.offset ?? 0) + 1,
          pageSize: query?.limit,
        }}
      />

      <PropertyForm
        initialVal={initialProps}
        type="resource-definition"
        handleSubmit={(data) => updateMutation.mutate(data)}
      />
    </>
  );
};
