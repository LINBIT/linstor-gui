import React, { useState } from 'react';
import { Button, Form, Space, Table, Tag, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import PropertyForm from '@app/components/PropertyForm';
import { getResources, getResourceCount, deleteResource, resourceModify } from '../api';
import { SearchForm } from './styled';
import { uniqId } from '@app/utils/stringUtils';
import { ResourceDataType, ResourceListQuery, ResourceModifyRequestBody, VolumeDataType } from '../types';
import { omit } from '@app/utils/object';
import { formatBytes } from '@app/utils/size';

export const List = () => {
  const { t } = useTranslation(['resource_group', 'common']);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState<ResourceDataType>();
  const [volumeList, setVolumeList] = useState([]);

  const [query, setQuery] = useState<ResourceListQuery>({});

  const history = useHistory();
  const [form] = Form.useForm();

  const {
    data: resources,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['getResources', query],
    queryFn: () => getResources(query),
    onSuccess: (data) => {
      const volumes = [];

      if (!data?.data) {
        return;
      }

      for (const item of data?.data) {
        volumes.push(
          ...item.volumes.map((e) => ({
            ...e,
            id: uniqId(),
            node_name: item.node_name,
            resource_name: item.name,
            in_use: item.state?.in_use,
          }))
        );
      }

      console.log(volumes, 'volumes');

      setVolumeList(volumes);
    },
  });

  console.log(volumeList, 'volumeList');

  const { data: stats } = useQuery({
    queryKey: ['getResourceCount'],
    queryFn: () => getResourceCount(),
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();

    const newQuery: ResourceListQuery = { ...query };

    if (values.name) {
      newQuery.resources = [values.name];
    }

    setQuery(newQuery);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({
      limit: 10,
      offset: 0,
    });
  };

  const updateMutation = useMutation({
    mutationKey: ['resourceModify'],
    mutationFn: (data: ResourceModifyRequestBody) =>
      resourceModify({
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

  const columns: TableProps<ResourceDataType & VolumeDataType>['columns'] = [
    {
      title: 'Resource',
      key: 'resource',
      dataIndex: 'resource_name',
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
      title: 'Node',
      key: 'node_name',
      dataIndex: 'node_name',
    },
    {
      title: 'Device Name',
      key: 'device_path',
      dataIndex: 'device_path',
    },
    {
      title: 'Allocated',
      key: 'allocated',
      dataIndex: 'allocated_size_kib',
      render: (allocated_size_kib) => {
        return <span>{formatBytes(allocated_size_kib)}</span>;
      },
    },
    {
      title: 'In Use',
      key: 'in_use',
      dataIndex: 'in_use',
      align: 'center',
      render: (in_use) => {
        return (
          <span>
            {in_use ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, item) => {
        // const upToDate = item.state?.disk_state === 'UpToDate';
        return <span>{item?.state?.disk_state || 'UnKnown'}</span>;
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
            onClick={() => {
              setCurrent(record);
              const currentData = omit(record.props ?? {}, 'CurStltConnName');
              setInitialProps({
                ...currentData,
                name: record.name,
              });
              setPropertyModalOpen(true);
            }}
          >
            Property
          </Button>
        </Space>
      ),
    },
  ];

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

        <Button type="primary" onClick={() => history.push('/inventory/resources/create')}>
          Add
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={volumeList}
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
        type="volume"
        handleSubmit={(data) => updateMutation.mutate(data)}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
