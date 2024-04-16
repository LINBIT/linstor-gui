import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown, Select } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { DownOutlined } from '@ant-design/icons';

import PropertyForm from '@app/components/PropertyForm';
import {
  getResourceDefinition,
  getResourceDefinitionCount,
  deleteResourceDefinition,
  getVolumeDefinitionListByResource,
  updateResourceDefinition,
} from '../api';
import {
  ResourceDefinition,
  ResourceDefinitionListQuery,
  UpdateResourceDefinitionRequestBody,
  VolumeDefinition,
} from '../types';
import get from 'lodash.get';
import { SearchForm } from './styled';
import { SpawnForm } from './SpawnForm';
import { uniqId } from '@app/utils/stringUtils';
import { omit } from '@app/utils/object';
import { formatBytes } from '@app/utils/size';

export const List = () => {
  const [current, setCurrent] = useState<ResourceDefinition>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();

  const [query, setQuery] = useState<ResourceDefinitionListQuery>({
    limit: 10,
    offset: 0,
  });

  const history = useHistory();
  const [form] = Form.useForm();

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
      ? resourceDefinition?.data?.map(({ name, resource_group_name }) => {
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
        }) ?? []
      : [],
  });

  const vdListDisplay = vdList.map((e) => e.data?.data).flat();

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
    history.push(`/storage-configuration/resource-definitions/${resourceDefinitionName}/edit`);
  };

  const columns: TableProps<
    VolumeDefinition & {
      rdName: string;
      rgName: string;
    }
  >['columns'] = [
    {
      title: 'Resource Definition Name',
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
      title: 'Resource Group Name',
      key: 'rgName',
      dataIndex: 'rgName',
      sorter: (a, b) => {
        return (a?.rgName ?? '').localeCompare(b?.rgName ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: 'Size',
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
          <Form.Item name="name" label="Resource Definition">
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
        // @ts-ignore
        dataSource={vdListDisplay ?? []}
        rowSelection={rowSelection}
        rowKey={uniqId()}
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
        openStatus={propertyModalOpen}
        type="resource-definition"
        handleSubmit={(data) => updateMutation.mutate(data)}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
