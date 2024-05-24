import React, { useCallback, useState } from 'react';
import { Button, Form, Space, Table, Popconfirm, Input } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';

import PropertyForm from '@app/components/PropertyForm';
import { getResources, deleteResource, resourceModify } from '../api';
import { SearchForm } from './styled';
import { uniqId } from '@app/utils/stringUtils';
import { ResourceDataType, ResourceListQuery, ResourceModifyRequestBody, VolumeType } from '../types';
import dayjs from 'dayjs';

export const List = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [current, setCurrent] = useState<ResourceDataType>();

  const [query, setQuery] = useState<ResourceListQuery>({});

  const history = useHistory();
  const [form] = Form.useForm();

  const getResourcesRequest = async () => {
    const res = await getResources(query);

    let resData: ResourceDataType[] = [];

    // 将 res.data 中的数据转换为 resData， volumes 是数组, 将里面的数据提到外层
    if (res.data) {
      resData = res.data
        .map((item) => {
          const { volumes, ...rest } = item;
          return volumes?.map((volume) => ({
            ...rest,
            resourceState: rest.state,
            ...volume,
          }));
        })
        .flat() as ResourceDataType[];
    }

    return resData;
  };

  const { data: resources, refetch } = useQuery({
    queryKey: ['getResources', query],
    queryFn: getResourcesRequest,
  });

  console.log(resources, 'resources');

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
    mutationKey: ['deleteResource'],
    mutationFn: (node: string) => deleteResource(node),
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
      deleteMutation.mutate(String(ele));
    });
  };

  const getVolumeCellState = (vlm_state, rsc_flags, vlm_flags) => {
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

  const handleResourceStateDisplay = useCallback((resourceItem: ResourceDataType) => {
    let stateStr = 'Unknown';
    const flags = resourceItem.flags || [];
    const rsc_state_obj = resourceItem.resourceState || {};
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
  }, []);

  const columns: TableProps<
    ResourceDataType &
      VolumeType & {
        resourceState: {
          in_use: boolean;
        };
      }
  >['columns'] = [
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
      title: 'Volume Number',
      key: 'volume_number',
      dataIndex: 'volume_number',
    },
    {
      title: 'Storage Pool Name',
      key: 'storage_pool_name',
      dataIndex: 'storage_pool_name',
    },
    {
      title: 'Node',
      key: 'node_name',
      dataIndex: 'node_name',
    },
    {
      title: 'Port',
      key: 'port',
      render: (_, item) => {
        const port = item.layer_object?.drbd?.drbd_resource_definition?.port || 'N/A';
        return <span>{port}</span>;
      },
    },
    {
      title: 'State',
      key: 'state',
      align: 'center',
      render: (_, item) => {
        const state = item.resourceState.in_use ? 'In Use' : 'Unused';
        return <span>{state}</span>;
      },
    },
    {
      title: 'Create Time',
      key: 'create_time',
      dataIndex: 'create_timestamp',
      render: (create_timestamp) => {
        return <span>{dayjs(create_timestamp).format('YYYY-MM-DD HH:mm:ss')}</span>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, item) => {
        return <span>{handleResourceStateDisplay(item)}</span>;
      },
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
        columns={columns as any}
        dataSource={resources ?? []}
        rowSelection={rowSelection}
        rowKey={(item) => item?.uuid ?? uniqId()}
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
