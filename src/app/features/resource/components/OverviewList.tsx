// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Space, Table, Input, Flex, Tag, Dropdown, Popconfirm, Select, Modal } from 'antd';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import get from 'lodash.get';
import uniqBy from 'lodash.uniqby';
import { MoreOutlined } from '@ant-design/icons';

import { uniqId } from '@app/utils/stringUtils';
import { formatBytes } from '@app/utils/size';
import {
  deleteResourceDefinition,
  getResourceDefinition,
  ResourceDefinitionListQuery,
  updateResourceDefinition,
  UpdateResourceDefinitionRequestBody,
  updateVolumeDefinition,
  VolumeDefinitionModify,
} from '@app/features/resourceDefinition';
import { CreateForm, getVolumeDefinitionListByResource } from '@app/features/volumeDefinition';
import { useWidth } from '@app/components/PageBasic/WidthContext';
import PropertyForm from '@app/components/PropertyForm';

import {
  adjustResourceGroup,
  deleteResource,
  getResources,
  resourceMigration,
  resourceModify,
  toggleResource,
} from '../api';
import { GetResourcesResponseBody, ResourceDataType, ResourceModifyRequestBody } from '../types';
import { CloneForm } from './Clone';
import { ResourceMigrateForm } from './ResourceMigrateForm';
import { SearchForm } from './styled';
import './OverviewList.css';

const TAG_COLORS = ['cyan', 'blue', 'geekblue', 'purple'];

export const OverviewList = () => {
  const [resourceDefinitionList, setResourceDefinitionList] = useState<GetResourcesResponseBody>();
  const [current, setCurrent] = useState<any>();
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();
  const [rdPropertyModalOpen, setRdPropertyModalOpen] = useState(false);
  const [vdPropertyModalOpen, setVdPropertyModalOpen] = useState(false);
  const [resourcePropertyModalOpen, setResourcePropertyModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<string>();
  const [snapshotName, setSnapshotName] = useState<string>('');
  const [migrationInfo, setMigrationInfo] = useState<{
    resource: string;
    node: string;
  }>({
    resource: '',
    node: '',
  });

  const { width } = useWidth();

  const isLargeScreen = width >= 1080;

  const history = useHistory();
  const [form] = Form.useForm();
  const location = useLocation();
  const resource_group = Form.useWatch('resource_group', form);

  const { t } = useTranslation(['volume', 'common']);

  const [query, setQuery] = useState<ResourceDefinitionListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const resource_definitions = query.get('resource-definitions')?.split(',');

    const queryO: ResourceDefinitionListQuery = {};

    if (resource_definitions) {
      form.setFieldValue('name', resource_definitions);
      queryO['resource_definitions'] = resource_definitions;
    }

    return {
      resource_definitions,
    };
  });

  const dispatch = useDispatch();

  const migrateResourceMutation = useMutation({
    mutationFn: resourceMigration,
  });

  const handleCreateSnapShot = async () => {
    if (currentResource && snapshotName != '') {
      await dispatch.snapshot.createSnapshot({ resource: currentResource, name: snapshotName });
      setIsModalOpen(false);
      setSnapshotName('');
    }
  };

  const handleOpenMigrate = (resource: string, node: string) => {
    setMigrateModalOpen(true);
    setMigrationInfo({ resource, node });
  };

  const handleSnapshot = (resource: string) => {
    setIsModalOpen(true);
    setCurrentResource(resource);
  };

  const handleMigrate = async (val: { node: string }) => {
    const res = await migrateResourceMutation.mutateAsync({
      resource: migrationInfo.resource,
      fromnode: migrationInfo.node,
      node: val.node,
    });

    if (res.data) {
      setMigrateModalOpen(false);
    }
  };

  const fetchData = async () => {
    const data = await getResourceDefinition({
      ...query,
    });

    if (!data?.data) {
      return;
    }

    const updatedData = await Promise.all(
      data.data.map(async (resource) => {
        const { name } = resource;
        const resources = await getResources({ resources: [name ?? ''] });
        const volumeDefinitions = await getVolumeDefinitionListByResource(name ?? '');

        const resourceWithVolumes = {
          ...resource,
          volumes: [],
          volumeDefinitions: volumeDefinitions.data,
        } as any;

        // Merge volumes with the outer layer
        resourceWithVolumes.volumes = resources?.data?.flatMap(
          (e) =>
            e.volumes?.map((v) => {
              const matchingVolume = volumeDefinitions.data?.find((vd) => vd.volume_number === v.volume_number);
              return {
                ...v,
                size_kib: matchingVolume?.size_kib || 0,
                node_name: e.node_name,
                resource_name: e.name,
                primary_node: e.state?.in_use ? e.node_name : '',
                resource_group_name: resource.resource_group_name || '',
                flags: e.flags,
                volume_definition: matchingVolume,
                resource: e,
                resourceDefinition: resource,
              };
            }) || [],
        );

        return resourceWithVolumes;
      }),
    );

    setResourceDefinitionList(updatedData);

    return updatedData;
  };

  const { isLoading, refetch } = useQuery({
    queryKey: ['getResourceDefinitionList', query],
    queryFn: fetchData,
  });

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const queryS = new URLSearchParams({});
    const newQuery: ResourceDefinitionListQuery = { ...query };

    if (values.name) {
      newQuery.resource_definitions = [values.name];
      queryS.set('resource-definitions', values.name);
    }

    setQuery(newQuery);

    const new_url = `${location.pathname}?${queryS.toString()}`;

    history.push(new_url);
  };

  const adjustResourceGroupMutation = useMutation({
    mutationKey: ['adjustResourceGroupMutation'],
    mutationFn: adjustResourceGroup,
    onSuccess: () => {
      refetch();
    },
  });

  const toggleResourceMutation = useMutation({
    mutationKey: ['toggleResourceMutation'],
    mutationFn: (data: { resource: string; node: string; action: 'to_diskless' | 'to_diskful' }) => {
      const { resource, node, action } = data;
      return toggleResource(resource, node, action);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteResourceMutation = useMutation({
    mutationKey: ['deleteResource'],
    mutationFn: ({ resource, node }: { resource: string; node: string }) => deleteResource(resource, node),
    onSuccess: () => {
      refetch();
    },
  });

  const updateResourceMutation = useMutation({
    mutationKey: ['resourceModify'],
    mutationFn: (data: ResourceModifyRequestBody) => {
      return resourceModify(current?.resource_name ?? '', current?.node_name ?? '', data);
    },
    onSuccess: () => {
      setResourcePropertyModalOpen(false);
      refetch();
    },
  });

  const updateResourceDefinitionMutation = useMutation({
    mutationKey: ['updateResourceDefinition'],
    mutationFn: (data: UpdateResourceDefinitionRequestBody) =>
      updateResourceDefinition(current?.name ?? '', data as any),
    onSuccess: () => {
      setRdPropertyModalOpen(false);
      refetch();
    },
  });

  const updateVolumeDefinitionMutation = useMutation({
    mutationKey: ['updateVolumeDefinition'],
    mutationFn: (data: VolumeDefinitionModify) => updateVolumeDefinition(current?.name ?? '', 0, data as any),
    onSuccess: () => {
      setVdPropertyModalOpen(false);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ['deleteResourceDefinition'],
    mutationFn: (resource: string) => deleteResourceDefinition(resource),
    onSuccess: () => {
      refetch();
    },
  });

  const handleReset = () => {
    form.resetFields();
    setQuery({
      resource_definitions: undefined,
    });

    history.push(location.pathname);
    refetch();
  };

  const handleConnectStatusDisplay = (resourceItem: ResourceDataType) => {
    console.log('resourceItem', resourceItem);

    let failStr = '';
    const conn = get(resourceItem, 'layer_object.drbd.connections', {}) as any;
    if (Object.keys(conn).length === 0) {
      return 'OK';
    }
    let count = 0;
    let fail = false;
    for (const nodeName in conn) {
      count++;
      if (!conn[nodeName].connected) {
        fail = true;
        if (failStr !== '') {
          failStr += ',';
        }
        failStr += `${nodeName} ${conn[nodeName].message}`;
      }
    }
    fail = count === 0 ? true : fail;
    failStr = fail ? failStr : 'OK';
    return failStr;
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
          stateStr = getVolumeCellState(vlm_state as any, flags, vlm_flags);

          if (flags.includes('EVACUATE')) {
            stateStr += ', Evacuating';
          }
        }
      }
    }

    return stateStr;
  };

  const CSProps = Array.from(
    new Set(
      resourceDefinitionList?.flatMap((item) => Object.keys(item.props ?? {}).filter((key) => key.startsWith('Aux'))),
    ),
  );

  const extraColumns = isLargeScreen
    ? [
        {
          title: t('common:port'),
          key: 'port',
          render: (item: any) => {
            const DRBDData = item?.layer_data?.find((e: any) => e.type === 'DRBD');
            return <span>{get(DRBDData, 'data.port', 'N/A')}</span>;
          },
        },

        ...(CSProps?.map((e) => {
          return {
            title: e,
            key: e,
            render: (item: any) => {
              return <span>{get(item, `props.${e}`)}</span>;
            },
          };
        }) ?? []),
      ]
    : [];

  const columns: TableProps<any>['columns'] = [
    {
      title: t('common:name'),
      key: 'resource',
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
      title: t('common:resource_group'),
      key: 'resource_group_name',
      dataIndex: 'resource_group_name',
      render: (resource_group_name) => {
        return (
          <Button
            type="link"
            onClick={() => {
              history.push(`/storage-configuration/resource-groups?resource_groups=${resource_group_name}`);
            }}
          >
            {resource_group_name}
          </Button>
        );
      },
    },
    {
      title: t('common:layers'),
      key: 'layers',
      render: (_, record) => {
        return (
          <Flex gap="4px 0" wrap>
            {record?.layer_data?.map(
              (
                layer: {
                  type: string;
                },
                index: number,
              ) => {
                return (
                  <Tag key={index} color={TAG_COLORS[index]} bordered={false}>
                    {layer.type}
                  </Tag>
                );
              },
            )}
          </Flex>
        );
      },
    },
    {
      title: t('common:state'),
      key: 'state',
      render: (_, rd) => {
        const state = rd.flags?.find((flag: string) => flag === 'DELETE') != null ? 'DELETING' : 'OK';
        return <Tag color={state === 'DELETING' ? 'red' : 'green'}>{state}</Tag>;
      },
    },
    ...extraColumns,
    {
      title: t('common:action'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const isUsingZFS = record.volumes.every((e: any) => e.provider_kind === 'ZFS');
        return (
          <Space size="small">
            <Popconfirm
              title="Adjust the resource"
              description="Are you sure to adjust this resource?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                adjustResourceGroupMutation.mutate({
                  resource_group: record.resource_group_name,
                });
              }}
            >
              <Button type="primary">{t('common:adjust')}</Button>
            </Popconfirm>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'clone',
                    label: <CloneForm resource={record.name} isUsingZFS={isUsingZFS} />,
                  },
                  {
                    key: 'property',
                    label: (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: '1',
                              label: (
                                <span
                                  onClick={() => {
                                    setCurrent(record);
                                    setInitialProps(record.props ?? {});
                                    setRdPropertyModalOpen(true);
                                  }}
                                >
                                  {t('common:resource_definition')}
                                </span>
                              ),
                            },
                            {
                              key: '2',
                              label: (
                                <span
                                  onClick={() => {
                                    setCurrent(record);
                                    setInitialProps(record.volumeDefinitions[0].props ?? {});
                                    setVdPropertyModalOpen(true);
                                  }}
                                >
                                  {t('common:volume_definition')}
                                </span>
                              ),
                            },
                          ],
                        }}
                        placement="bottomRight"
                      >
                        <span>{t('common:property')}</span>
                      </Dropdown>
                    ),
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        key="delete"
                        title="Delete the resource definition"
                        description="Are you sure to delete this resource definitions?"
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => {
                          deleteMutation.mutate(record.name);
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
        );
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
          <Form.Item name="name" label={t('common:name')}>
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item name="resource_group" label={t('common:resource_group')}>
            <Select
              showSearch
              allowClear
              style={{ width: 200 }}
              options={
                resourceDefinitionList?.map((e: any) => ({
                  label: e.resource_group_name,
                  value: e.resource_group_name,
                })) || []
              }
              placeholder="Select a resource group"
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
            </Space>
          </Form.Item>
        </Form>

        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: (
                  <span onClick={() => history.push('/storage-configuration/resource-definitions/create')}>
                    {t('common:resource_definition')}
                  </span>
                ),
              },
              {
                key: '2',
                label: <CreateForm refetch={refetch} simple />,
              },
              {
                key: '3',
                label: (
                  <span onClick={() => history.push('/storage-configuration/resources/create')}>
                    {t('common:resource')}
                  </span>
                ),
              },
            ],
          }}
          placement="bottomRight"
        >
          <Button type="primary">{t('common:add')}</Button>
        </Dropdown>
      </SearchForm>

      <br />

      <Table
        loading={isLoading}
        columns={columns}
        expandable={{
          expandedRowRender: (record) => {
            return (
              <Table
                bordered
                size="small"
                columns={[
                  {
                    title: t('common:node'),
                    key: 'node_name',
                    dataIndex: 'node_name',
                    render: (node_name) => {
                      return <span>{node_name}</span>;
                    },
                  },
                  {
                    title: t('common:volume_number_short'),
                    key: 'volume_number',
                    dataIndex: 'volume_number',
                    render: (volume_number) => {
                      return <span>{volume_number}</span>;
                    },
                  },
                  {
                    title: t('common:size'),
                    key: 'size',
                    render: (_, record) => {
                      return (
                        <span>
                          {formatBytes(record.allocated_size_kib ?? 0)} / {formatBytes(record?.size_kib ?? 0)} (
                          {(((record.allocated_size_kib ?? 0) / (record.size_kib ?? 0)) * 100).toFixed(2)}%)
                        </span>
                      );
                    },
                  },
                  {
                    title: t('volume:device_name'),
                    key: 'device_path',
                    dataIndex: 'device_path',
                  },
                  {
                    title: t('resource:connection_status'),
                    key: 'connection_status',
                    render: (record) => {
                      const connectionStatus = handleConnectStatusDisplay(record?.resource);
                      return <Tag color={connectionStatus === 'OK' ? 'green' : 'red'}>{connectionStatus}</Tag>;
                    },
                  },
                  {
                    title: t('common:state'),
                    key: 'state',
                    dataIndex: 'state',
                    render: (state, record) => {
                      const isPrimaryNode = record?.node_name?.toLowerCase() === record?.primary_node?.toLowerCase();
                      const stateStr = handleResourceStateDisplay(record.resource);
                      return (
                        <>
                          <Tag color="geekblue">{stateStr}</Tag>
                          {isPrimaryNode && <Tag color="cyan">{t('common:primary')}</Tag>}
                        </>
                      );
                    },
                  },
                  {
                    title: t('common:action'),
                    key: 'action',
                    width: 150,
                    fixed: 'right',
                    render: (_, record) => (
                      <>
                        <Popconfirm
                          title="Toggle the resource"
                          description="Are you sure to toggle this resource?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => {
                            const isDiskless = record.flags && record.flags.includes('DRBD_DISKLESS');

                            toggleResourceMutation.mutate({
                              resource: record.resource_name,
                              node: record.node_name,
                              action: isDiskless ? 'to_diskful' : 'to_diskless',
                            });
                          }}
                        >
                          <Button type="primary">{t('common:toggle')}</Button>
                        </Popconfirm>

                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'property',
                                label: t('common:property'),
                                onClick: () => {
                                  setCurrent({
                                    ...record?.resource.props,
                                    resource_name: record.resource_name,
                                    node_name: record.node_name,
                                  });

                                  const currentData = record?.resource.props;
                                  setInitialProps({
                                    ...currentData,
                                    name: record?.resource_name,
                                  });
                                  setResourcePropertyModalOpen(true);
                                },
                              },
                              {
                                key: 'snapshot',
                                label: t('common:snapshot'),
                                onClick: () => {
                                  handleSnapshot(record.resource_name ?? '');
                                },
                              },
                              {
                                key: 'migrate',
                                label: t('common:migrate'),
                                onClick: () => {
                                  handleOpenMigrate(record.resource_name ?? '', record.node_name ?? '');
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
                                      deleteResourceMutation.mutate({
                                        resource: record.resource_name ?? '',
                                        node: record.node_name ?? '',
                                      });
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
                      </>
                    ),
                  },
                ]}
                dataSource={record.volumes}
                rowKey={(item) => item?.uuid ?? uniqId()}
                pagination={false}
                rowClassName={(record) => {
                  const isPrimaryNode = record?.node_name?.toLowerCase() === record?.primary_node?.toLowerCase();
                  return isPrimaryNode ? 'ant-table-row-primary' : '';
                }}
              />
            );
          },
          rowExpandable: (record) => (record?.volumes?.length ?? 0) > 0,
        }}
        dataSource={resourceDefinitionList?.filter((e: any) => e?.resource_group_name != resource_group) ?? []}
        rowKey={(item) => item?.name ?? uniqId()}
      />

      <PropertyForm
        initialVal={initialProps}
        openStatus={rdPropertyModalOpen}
        type="resource-definition"
        handleSubmit={(data) => updateResourceDefinitionMutation.mutate(data)}
        handleClose={() => setRdPropertyModalOpen(!rdPropertyModalOpen)}
        loading={updateResourceDefinitionMutation.isLoading}
      />

      <PropertyForm
        initialVal={initialProps}
        openStatus={vdPropertyModalOpen}
        type="volume-definition"
        handleSubmit={(data) => updateVolumeDefinitionMutation.mutate(data)}
        handleClose={() => setVdPropertyModalOpen(!vdPropertyModalOpen)}
        loading={updateVolumeDefinitionMutation.isLoading}
      />

      <PropertyForm
        initialVal={initialProps}
        openStatus={resourcePropertyModalOpen}
        type="resource"
        handleSubmit={(data) => updateResourceMutation.mutate(data)}
        handleClose={() => setResourcePropertyModalOpen(!resourcePropertyModalOpen)}
        loading={updateResourceMutation.isLoading}
      />

      <Modal
        title={t('resource:create_snapshot')}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateSnapShot}
      >
        <Input
          type="text"
          placeholder="Please input snapshot name here..."
          value={snapshotName}
          onChange={(evt) => {
            setSnapshotName(evt.target.value);
          }}
        />
      </Modal>
      <ResourceMigrateForm
        open={migrateModalOpen}
        migrationInfo={migrationInfo}
        onCancel={() => {
          setMigrateModalOpen(false);
        }}
        onCreate={handleMigrate}
      />
    </>
  );
};