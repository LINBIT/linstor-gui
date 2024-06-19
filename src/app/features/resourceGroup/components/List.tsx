import React, { useMemo, useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import PropertyForm from '@app/components/PropertyForm';
import { getResourceGroups, getResourceGroupCount, deleteResourceGroup, updateResourceGroup } from '../api';
import { CreateResourceGroupRequestBody, ResourceGroupListQuery, UpdateResourceGroupRequestBody } from '../types';
import { SearchForm } from './styled';
import { SpawnForm } from './SpawnForm';
import { uniqId } from '@app/utils/stringUtils';

export const List = () => {
  const { t } = useTranslation(['resource_group', 'common']);
  const [current, setCurrent] = useState<CreateResourceGroupRequestBody>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();

  const history = useHistory();
  const location = useLocation();
  const [form] = Form.useForm();

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

  const { data: resourceGroups, refetch } = useQuery({
    queryKey: ['getResourceGroups', query],
    queryFn: () => getResourceGroups(query),
  });

  const { data: stats } = useQuery({
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

      history.push(new_url);
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    history.push('/storage-configuration/resource-groups');
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
    history.push(`/storage-configuration/resource-groups/${resource_group}/edit`);
  };

  const replicationMap = {
    A: t('async'),
    B: t('semi_sync'),
    C: t('sync'),
  };

  const columns: TableProps<CreateResourceGroupRequestBody>['columns'] = [
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
      title: 'Place Count',
      key: 'place_count',
      render: (_, item) => {
        return item?.select_filter?.place_count;
      },
      showSorterTooltip: false,
    },
    {
      title: 'Storage Pool(s)',
      key: 'Storage Pool(s)',
      render: (_, item) => {
        const sp = Array.isArray(item?.select_filter?.storage_pool_list)
          ? item?.select_filter?.storage_pool_list ?? []
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
      title: 'Replication Mode',
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
      title: 'Diskless on remaining',
      key: 'state',
      align: 'center',
      render: (_, item) => {
        const state = item.select_filter?.diskless_on_remaining ? 'Yes' : 'No';
        return <Tag>{state}</Tag>;
      },
    },
    {
      title: 'Description',
      key: 'description',
      dataIndex: 'description',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <SpawnForm resource_group={record.name} />

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
                    edit(record.name);
                  },
                },
                {
                  key: 'property',
                  label: 'Properties',
                  onClick: () => {
                    setCurrent(record);
                    setInitialProps(record.props ?? {});
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
                  title="Delete selected resource groups"
                  description="Are you sure to delete selected resource groups?"
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

        <Button type="primary" onClick={() => history.push('/storage-configuration/resource-groups/create')}>
          Add
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
