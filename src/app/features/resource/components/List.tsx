import React, { useState } from 'react';
import { Button, Form, Space, Table, Popconfirm, Input, Dropdown } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined } from '@ant-design/icons';

import PropertyForm from '@app/components/PropertyForm';
import { getResources, getResourceCount, deleteResource, resourceModify } from '../api';
import { SearchForm } from './styled';

import { ResourceDataType, ResourceListQuery, ResourceModifyRequestBody } from '../types';

import { formatTime } from '@app/utils/time';
import get from 'lodash.get';
import { createSnapshot, CreateSnapshotRequestBody } from '@app/features/snapshot';

type ListProps = {
  handleOpenMigrate: (resource: string, node: string) => void;
  handleSnapshot: (resource: string) => void;
};

export const List = ({ handleOpenMigrate, handleSnapshot }: ListProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState<ResourceDataType>();

  const history = useHistory();
  const [form] = Form.useForm();
  const location = useLocation();

  const [query, setQuery] = useState<ResourceListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const nodes = query.get('nodes')?.split(',');

    if (nodes) {
      form.setFieldValue('name', nodes);
    }

    return {
      limit: 10,
      offset: 0,
      nodes,
    };
  });

  const {
    data: resources,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['getResources', query],
    queryFn: () => getResources(query),
  });

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

  const createResourceMutation = useMutation({
    mutationFn: (data: CreateSnapshotRequestBody) => {
      const { resource_name, ...rest } = data;
      return createSnapshot(resource_name || '', rest);
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteResource'],
    mutationFn: ({ resource, node }: { resource: string; node: string }) => deleteResource(resource, node),
    onSuccess: () => {
      refetch();
    },
  });

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
      const resource = resources?.data?.find((item) => item.name === ele);
      const node = resource?.node_name;
      deleteMutation.mutate({
        resource: resource?.name ?? '',
        node: node ?? '',
      });
    });
  };

  const getVolumeCellState = (
    vlm_state: { disk_state: string },
    rsc_flags: string | string[],
    vlm_flags: string | string[],
  ) => {
    const state_prefix = vlm_flags.indexOf('RESIZE') > -1 ? 'Resizing, ' : '';
    let state = state_prefix + 'Unknown';
    if (vlm_state && vlm_state.disk_state) {
      const disk_state = vlm_state.disk_state;
      if (disk_state == 'DUnknown') {
        state = state_prefix + 'Unknown';
      } else if (disk_state == 'Diskless') {
        if (!rsc_flags.includes('DISKLESS')) {
          state = state_prefix + disk_state;
        } else if (rsc_flags.includes('TIE_BREAKER')) {
          state = 'TieBreaker';
        } else {
          state = state_prefix + disk_state;
        }
      } else {
        state = state_prefix + disk_state;
      }
    }
    return state;
  };

  const handleResourceStateDisplay = (resourceItem: ResourceDataType) => {
    let stateStr = 'Unknown';
    const flags = resourceItem.flags || [];
    const rsc_state_obj = resourceItem.state || {};
    const volumes = resourceItem.volumes || [];

    if (flags.includes('DELETE')) {
      stateStr = 'DELETING';
    } else if (flags.includes('INACTIVE')) {
      stateStr = 'INACTIVE';
    } else if (rsc_state_obj) {
      if (typeof rsc_state_obj.in_use !== 'undefined') {
        for (let i = 0; i < volumes.length; ++i) {
          const volume = volumes[i];
          const vlm_state = volume.state || {};
          const vlm_flags = volume.flags || [];
          stateStr = getVolumeCellState(vlm_state, flags, vlm_flags);

          if (flags.includes('EVACUATE')) {
            stateStr += ', Evacuating';
          }
        }
      }
    }

    return stateStr;
  };

  const columns: TableProps<ResourceDataType>['columns'] = [
    {
      title: 'Resource',
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
      title: 'Node',
      key: 'node_name',
      dataIndex: 'node_name',
    },
    {
      title: 'Created On',
      key: 'create_timestamp',
      dataIndex: 'create_timestamp',
      render: (create_timestamp) => {
        return <span>{formatTime(create_timestamp)}</span>;
      },
    },
    {
      title: 'Port',
      key: 'port',
      render: (item) => {
        return <span>{get(item, 'layer_object.drbd.drbd_resource_definition.port')}</span>;
      },
    },
    {
      title: 'Usage Status',
      key: 'in_use',
      dataIndex: 'in_use',
      align: 'center',
      render: (_, item) => {
        const in_use = item.state?.in_use;
        const usage = in_use ? 'InUse' : 'Unused';
        return (
          <span>
            {in_use ? (
              <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            ) : (
              <CloseCircleFilled style={{ color: 'grey', fontSize: '16px' }} />
            )}
            <span style={{ marginLeft: 8 }}>{usage}</span>
          </span>
        );
      },
    },
    {
      title: 'State',
      key: 'state',
      align: 'center',
      render: (_, item) => {
        return <span>{handleResourceStateDisplay(item)}</span>;
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
              history.push(`/storage-configuration/resources/${record.node_name}/${record.name}/edit`);
            }}
          >
            Edit
          </Button>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'property',
                  label: 'Properties',
                  onClick: () => {
                    setCurrent(record);
                    const currentData = record.props;
                    setInitialProps({
                      ...currentData,
                      name: record.name,
                    });
                    setPropertyModalOpen(true);
                  },
                },
                {
                  key: 'snapshot',
                  label: 'Snapshot',
                  onClick: () => {
                    handleSnapshot(record.name ?? '');
                  },
                },
                {
                  key: 'migrate',
                  label: 'Migrate',
                  onClick: () => {
                    handleOpenMigrate(record.name ?? '', record.node_name ?? '');
                  },
                },
                {
                  key: 'delete',
                  label: (
                    <Popconfirm
                      key="delete"
                      title="Delete the resource"
                      description="Are you sure to delete this resource?"
                      okText="Yes"
                      cancelText="No"
                      onConfirm={() => {
                        deleteMutation.mutate({
                          resource: record.name ?? '',
                          node: record.node_name ?? '',
                        });
                      }}
                    >
                      Delete
                    </Popconfirm>
                  ),
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

        <Button type="primary" onClick={() => history.push('/storage-configuration/resources/create')}>
          Add
        </Button>
      </SearchForm>

      <br />

      <Table
        columns={columns}
        dataSource={resources?.data ?? []}
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
        type="resource"
        handleSubmit={(data) => updateMutation.mutate(data)}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </>
  );
};
