import React, { useEffect, useState } from 'react';
import { Button, Form, Table, Select, Popconfirm, Input, Checkbox, Dropdown, Space } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import uniqby from 'lodash.uniqby';

import { formatBytes } from '@app/utils/size';
import { CreateSnapshotRequestBody, SnapshotListQuery, SnapshotType } from '../types';
import { createSnapshot, deleteSnapshot, getSnapshots } from '../api';
import { formatTime } from '@app/utils/time';

import { SearchForm } from './styled';
import { CreateSnapshotForm } from './CreateForm';
import { useNodes } from '@app/features/node';
import { getResources } from '@app/features/resource';

export const List = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const location = useLocation();

  const nodes = useNodes();
  const { data: resourceList } = useQuery({
    queryKey: ['getResource'],
    queryFn: () => {
      return getResources();
    },
  });

  const [query, setQuery] = useState<SnapshotListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes');
    const queryO: SnapshotListQuery = {};

    if (nodes) {
      form.setFieldValue('nodes', nodes);
      queryO['nodes'] = [nodes];
    }

    const resources = query.get('resources');

    if (resources) {
      form.setFieldValue('resources', resources);
      queryO.resources = [resources];
    }

    return queryO;
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const {
    data: snapshotList,
    isLoading,
    refetch,
  } = useQuery(['getSnapshots', query], () => {
    return getSnapshots(query);
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteSnapshot'],
    mutationFn: (data: { resource: string; snapshot: string }) => deleteSnapshot(data.resource, data.snapshot),
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
    const newQuery: SnapshotListQuery = { ...query };
    if (values.nodes) {
      newQuery.nodes = values.nodes;
      queryS.set('nodes', values.nodes);
    }

    if (values.resources) {
      newQuery.resources = values.resources;
      queryS.set('resources', values.resources);
    }

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    history.push(new_url);
  };

  const handleDeleteBulk = () => {
    selectedRowKeys.forEach((ele) => {
      const record = snapshotList?.data?.find((e) => e.uuid === ele);
      if (!record) {
        return;
      }

      deleteMutation.mutate({ resource: record.resource_name ?? '', snapshot: record.name ?? '' });
    });

    setSelectedRowKeys([]);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({});
    history.push('/snapshot');
  };

  const columns: TableProps<SnapshotType>['columns'] = [
    {
      title: 'Resource Name',
      key: 'resourceName',
      dataIndex: 'resource_name',
      sorter: (a, b) => {
        return (a.resource_name ?? '').localeCompare(b.resource_name ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: 'Snapshot Name',
      key: 'name',
      dataIndex: 'name',
      sorter: (a, b) => {
        return (a?.name ?? '').localeCompare(b?.name ?? '');
      },
      showSorterTooltip: false,
    },
    {
      title: 'Node Names',
      key: 'node_name',
      dataIndex: 'nodes',
      render: (nodes) => {
        return <span>{nodes.join(',')}</span>;
      },
    },
    {
      title: 'Volumes',
      key: 'volumes',
      dataIndex: 'volume_definitions',
      render: (volume_definitions) => {
        return (
          <span>
            {volume_definitions
              ?.map((e: { volume_number: string; size_kib: number }) => {
                return `${e.volume_number}: ${formatBytes(e.size_kib)}`;
              })
              .join(', ')}
          </span>
        );
      },
    },
    {
      title: 'Created On',
      key: 'created',
      dataIndex: 'snapshots',
      render: (snapshots) => {
        return <span>{formatTime(snapshots[0].create_timestamp)}</span>;
      },
    },
    {
      title: 'State',
      key: 'state',
      render: (_, item) => {
        const isSuccessful = item.flags?.includes('SUCCESSFUL');
        return (
          <span>
            {isSuccessful ? (
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
        <Popconfirm
          key="delete"
          title="Delete the snapshot"
          description="Are you sure to delete this snapshot?"
          okText="Yes"
          cancelText="No"
          onConfirm={() => {
            deleteMutation.mutate({ resource: record.resource_name ?? '', snapshot: record.name ?? '' });
          }}
        >
          <Button danger>Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <SearchForm>
        <Form
          form={form}
          name="node_list_form"
          layout="inline"
          initialValues={{
            show_default: true,
          }}
        >
          <Form.Item name="nodes" label="Nodes">
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

          <Form.Item name="resources" label="Resources">
            <Select
              style={{ width: 180 }}
              allowClear
              placeholder="Please select resource"
              options={uniqby(resourceList?.data, 'name')?.map((e: { name: string }) => ({
                label: e.name,
                value: e.name,
              }))}
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
            </Space>
          </Form.Item>
        </Form>
        <CreateSnapshotForm refetch={refetch} />

        {hasSelected && (
          <Popconfirm
            key="delete"
            title="Delete snapshots"
            description="Are you sure to delete selected snapshots?"
            okText="Yes"
            cancelText="No"
            onConfirm={handleDeleteBulk}
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        )}
      </SearchForm>
      <Table
        loading={isLoading}
        columns={columns}
        dataSource={snapshotList?.data ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid || ''}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />
    </>
  );
};
