// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Select } from 'antd';
import type { TableProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

import { getResources } from '../api';
import { SearchForm } from './styled';
import { uniqId } from '@app/utils/stringUtils';
import { GetResourcesResponseBody, ResourceDataType, ResourceListQuery, VolumeDataType } from '../types';

import { formatBytes } from '@app/utils/size';
import { useNodes } from '@app/features/node';
import withCustomColumns from '@app/components/WithCustomColumn';
import { getResourceDefinition } from '@app/features/resourceDefinition';

export const List = () => {
  const [volumeList, setVolumeList] = useState<GetResourcesResponseBody>();

  const history = useHistory();
  const [form] = Form.useForm();
  const location = useLocation();

  const [query, setQuery] = useState<ResourceListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes')?.split(',');
    const resources = query.get('resources')?.split(',');

    if (nodes) {
      form.setFieldValue('name', nodes);
    }

    const queryO: ResourceListQuery = {};

    if (nodes) {
      form.setFieldValue('nodes', nodes);
      queryO['nodes'] = nodes;
    }

    const storage_pools = query.get('storage_pools');

    if (storage_pools) {
      form.setFieldValue('storage_pools', storage_pools);
      queryO['storage_pools'] = [storage_pools];
    }

    if (resources) {
      form.setFieldValue('name', resources);
      queryO['resources'] = resources;
    }

    return {
      nodes,
      resources,
    };
  });

  const nodes = useNodes();

  const { isLoading } = useQuery({
    queryKey: ['getResources', query],
    queryFn: () => getResources(query),
    onSuccess: async (data) => {
      if (!data?.data) {
        return;
      }

      // fetch resource definition for each resource and update `parent`
      const updatedData = await Promise.all(
        data.data.map(async (volume) => {
          const { name } = volume;
          const resourceDefinition = await getResourceDefinition({
            resource_definitions: [name],
          });
          return {
            ...volume,
            parent: resourceDefinition.data?.[0],
          };
        }),
      );

      // Process `volumes` array from updated data
      const volumes = updatedData.flatMap(
        (item) =>
          item.volumes?.map((e) => ({
            ...e,
            id: uniqId(),
            node_name: item.node_name,
            resource_name: item.name,
            in_use: item.state?.in_use,
            resourceProps: item.props,
            parent: item.parent,
          })) || [],
      );

      setVolumeList(volumes as GetResourcesResponseBody);
    },
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: ResourceListQuery = { ...query };

    if (values.name) {
      newQuery.resources = [values.name];
      queryS.set('resources', values.name);
    }

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

    history.push(new_url);
  };

  const handleReset = () => {
    form.resetFields();
    setQuery({
      limit: 10,
      offset: 0,
    });

    history.push(location.pathname);
  };

  const columns: TableProps<
    ResourceDataType &
      VolumeDataType & {
        resourceProps: Record<string, string>;
      }
  >['columns'] = [
    {
      // TODO: Add a tooltip to the column header for the name and volume number
      title: 'Resource/VolumeNumber',
      key: 'resource',
      dataIndex: 'resource_name',
      sorter: (a, b) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name);
        } else {
          return 0;
        }
      },
      render: (resource_name, record) => {
        return <span>{`${resource_name}/${record.volume_number}`}</span>;
      },
      showSorterTooltip: false,
    },
    {
      title: 'Node',
      key: 'node_name',
      dataIndex: 'node_name',
      render: (node_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/inventory/nodes/${node_name}`);
            }}
          >
            {node_name}
          </Button>
        );
      },
    },
    {
      title: 'Storage Pool',
      key: 'storage_pool',
      render: (_, item) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/inventory/storage-pools?storage_pools=${item.resourceProps?.StorPoolName}`);
            }}
          >
            {item.resourceProps?.StorPoolName}
          </Button>
        );
      },
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
      title: 'State',
      key: 'state',
      align: 'center',
      render: (_, item) => {
        return <span>{item?.state?.disk_state || 'UnKnown'}</span>;
      },
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const CustomTable = withCustomColumns((props) => {
    return (
      <Table
        {...props}
        pagination={{
          total: volumeList?.length ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        scroll={{ x: 1080 }}
      />
    );
  });

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

          <Form.Item name="nodes" label="Node">
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
      </SearchForm>

      <br />

      <CustomTable initialColumns={columns as any} dataSource={volumeList ?? []} storageKey="volume" />
    </>
  );
};
