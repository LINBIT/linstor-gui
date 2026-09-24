// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Space, Table, Flex, Tag, Dropdown, Modal, Tooltip } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import type { TableProps, TablePaginationConfig } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { uniqBy } from 'lodash';
import { DownOutlined, LineChartOutlined, MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';

import { uniqId } from '@app/utils/stringUtils';
import { formatBytes } from '@app/utils/size';
import {
  deleteResourceDefinition,
  getResourceDefinition,
  ResourceDefinition,
  ResourceDefinitionListQuery,
  VolumeDefinition,
  updateResourceDefinition,
  UpdateResourceDefinitionRequestBody,
  updateVolumeDefinition,
  VolumeDefinitionModify,
  ResizeVolumeModal,
} from '@app/features/resourceDefinition';
import { CreateForm } from '@app/features/volumeDefinition';
import { SpawnForm } from '@app/features/resourceGroup/components/SpawnForm';
import { useWidth } from '@app/hooks';
import PropertyForm from '@app/components/PropertyForm';

import {
  adjustResourceGroup,
  deleteResource,
  getResources,
  resourceMigration,
  resourceModify,
  toggleResource,
} from '../api';
import { ResourceDataType, ResourceModifyRequestBody, VolumeType } from '../types';
import { CloneForm } from './Clone';
import { AddToNodeModal } from './AddToNodeModal';
import { ResourceMigrateForm } from './ResourceMigrateForm';
import { SearchForm } from './styled';
import './OverviewList.css';
import { filterResourceList } from './filterResourceList';
import { PropertyFormRef } from '@app/components/PropertyForm';
import { RootState } from '@app/store';
import { UIMode } from '@app/models/setting';
import { getResourceState } from '@app/utils/resource';
import { SyncFlowOverlay } from './SyncFlowOverlay';
import { Popconfirm } from '@app/components/Popconfirm';

/** One row of a definition's volume sub-table: a deployed volume joined with its resource and definition. */
type OverviewVolume = VolumeType & {
  size_kib: number;
  node_name?: string;
  resource_name?: string;
  /** The node the resource is Primary (in use) on, or '' when it is nowhere. */
  primary_node: string;
  resource_group_name: string;
  flags?: string[];
  volume_definition?: VolumeDefinition;
  resource: ResourceDataType;
  resourceDefinition: ResourceDefinition;
};

/** A resource definition with its deployed volumes, as the overview table lists it. */
type OverviewRow = ResourceDefinition & {
  volumes: OverviewVolume[];
  volumeDefinitions: VolumeDefinition[];
};

type SubTableColumns = NonNullable<TableProps<OverviewVolume>['columns']>;

interface ExpandableSubTableProps {
  volumes: OverviewVolume[];
  columns: SubTableColumns;
}

// Permanent left gutter that hosts the SyncFlowOverlay's arrows. Kept at a
// fixed width regardless of sync state so the table layout never jumps.
const SYNC_LANE_WIDTH = 96;

const ExpandableSubTable: React.FC<ExpandableSubTableProps> = ({ volumes, columns }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={containerRef} style={{ position: 'relative', paddingLeft: SYNC_LANE_WIDTH }}>
      <Table
        bordered
        size="small"
        columns={columns}
        dataSource={volumes}
        rowKey={(item) => `${item?.node_name}:${item?.volume_number ?? 0}`}
        rowClassName={(row) => {
          const isPrimaryNode = row?.node_name?.toLowerCase() === row?.primary_node?.toLowerCase();
          return isPrimaryNode ? 'ant-table-row-primary' : '';
        }}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <SyncFlowOverlay containerRef={containerRef} volumes={volumes} />
    </div>
  );
};

const TAG_COLORS = [
  '#FFCC9C',
  '#EEEEEE',
  '#E1C047',
  '#C0854E',
  '#F79133',
  '#499BBB',
  '#E1C047',
  '#65BDED',
  '#C0854E',
  '#84E4E9',
  '#FF6D6D',
  '#5FD4A9',
  '#C38EC8',
  '#BBD45F',
];

export const OverviewList = () => {
  const [resourceDefinitionList, setResourceDefinitionList] = useState<OverviewRow[]>();
  // The definition a row menu acted on, and the deployed resource a sub-row
  // menu acted on; the property forms and the resize modal read these.
  const [currentDefinition, setCurrentDefinition] = useState<OverviewRow>();
  const [currentResource_, setCurrentResource_] = useState<{ resource_name?: string; node_name?: string }>();
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();

  const rdPropertyFormRef = useRef<PropertyFormRef>(null);
  const vdPropertyFormRef = useRef<PropertyFormRef>(null);
  const resourcePropertyFormRef = useRef<PropertyFormRef>(null);

  const [searchKey, setSearchKey] = useState<string>('');
  const [filteredList, setFilteredList] = useState<OverviewRow[]>();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resizeModalOpen, setResizeModalOpen] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [addToNodeModalOpen, setAddToNodeModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<string>();
  const [usedNodes, setUsedNodes] = useState<string[]>([]);
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

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const location = useLocation();
  const resource_group = Form.useWatch('resource_group', form);

  useEffect(() => {
    const filtered = filterResourceList(resourceDefinitionList, resource_group, searchKey);
    setFilteredList(filtered);
  }, [resourceDefinitionList, resource_group, searchKey]);

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKey(value);
  };

  const { t } = useTranslation(['volume', 'common']);

  const [query, setQuery] = useState<ResourceDefinitionListQuery>(() => {
    const query = new URLSearchParams(location.search);
    const resource_definitions = query.get('resource-definitions')?.split(',');
    const resource = query.get('resource');

    const queryO: ResourceDefinitionListQuery = {};

    if (resource_definitions) {
      form.setFieldValue('name', resource_definitions);
      queryO['resource_definitions'] = resource_definitions;
    }

    if (resource) {
      form.setFieldValue('name', resource);
      setSearchKey(resource);
    }

    return {
      resource_definitions,
    };
  });

  const dispatch = useDispatch();

  const { mode, grafanaConfig } = useSelector((state: RootState) => ({
    mode: state.setting.mode,
    grafanaConfig: state.setting.grafanaConfig,
  }));

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

  const handleStatsClick = (nodeName: string, resourceName: string) => {
    if (!grafanaConfig?.enable) {
      Modal.warning({
        title: 'Grafana Dashboard Not Enabled',
        content: 'Please enable and configure Grafana Dashboard in Settings to view stats.',
      });
      return;
    }

    // Navigate to the Grafana stats page with node name and resource name as route params
    navigate(`/stats/${nodeName}/${encodeURIComponent(resourceName)}`);
  };

  const fetchResourceDefinitions = async () => {
    const data = await getResourceDefinition({
      ...query,
      with_volume_definitions: true,
    });

    return data?.data ?? [];
  };

  const fetchResourcesView = async () => (await getResources()).data ?? [];

  const {
    data: resourceDefinitions,
    isLoading: rdLoading,
    refetch: refetchResourceDefinitions,
  } = useQuery({
    queryKey: ['getResourceDefinitionList', query],
    queryFn: fetchResourceDefinitions,
    // Definitions/props/layers rarely change during a sync. Polling slow keeps
    // the controller load down even on large clusters.
    refetchInterval: 10000,
  });

  // Live state (disk_state, replication_states, done_percentage, in_use) is
  // fetched separately so it can poll fast during a sync without re-pulling
  // the heavier resource-definition payload. Constant 1s cadence so we don't
  // need to "detect" sync before going fast — the /v1/view/resources call is
  // a single lightweight endpoint.
  const {
    data: resourcesView,
    isLoading: rvLoading,
    refetch: refetchResourcesView,
  } = useQuery({
    queryKey: ['getResourcesView'],
    queryFn: fetchResourcesView,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
  });

  // Merge structural data (definitions) with live state (resources view).
  const mergedResourceDefinitionList = useMemo(() => {
    if (!resourceDefinitions) return undefined;
    return resourceDefinitions.map((resource): OverviewRow => {
      const { name, volume_definitions: volumeDefinitions } = resource;

      const resourceWithVolumes: OverviewRow = {
        ...resource,
        volumes: [],
        volumeDefinitions: volumeDefinitions || [],
      };

      resourceWithVolumes.volumes =
        resourcesView
          ?.filter((e) => e.name === name)
          ?.flatMap(
            (e) =>
              e.volumes?.map((v): OverviewVolume => {
                const matchingVolume = volumeDefinitions?.find((vd) => vd.volume_number === v.volume_number);
                return {
                  ...v,
                  size_kib: matchingVolume?.size_kib || 0,
                  node_name: e.node_name,
                  resource_name: e.name,
                  primary_node: e.state?.in_use ? (e.node_name ?? '') : '',
                  resource_group_name: resource.resource_group_name || '',
                  flags: e.flags,
                  volume_definition: matchingVolume,
                  resource: e,
                  resourceDefinition: resource,
                };
              }) || [],
          ) ?? [];

      return resourceWithVolumes;
    });
  }, [resourceDefinitions, resourcesView]);

  useEffect(() => {
    setResourceDefinitionList(mergedResourceDefinitionList);
  }, [mergedResourceDefinitionList]);

  const isLoading = rdLoading || rvLoading;
  const refetch = useCallback(() => {
    void refetchResourceDefinitions();
    void refetchResourcesView();
  }, [refetchResourceDefinitions, refetchResourcesView]);

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
      return resourceModify(currentResource_?.resource_name ?? '', currentResource_?.node_name ?? '', data);
    },
    onSuccess: () => {
      resourcePropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const updateResourceDefinitionMutation = useMutation({
    mutationKey: ['updateResourceDefinition'],
    mutationFn: (data: UpdateResourceDefinitionRequestBody) =>
      updateResourceDefinition(currentDefinition?.name ?? '', data),
    onSuccess: () => {
      rdPropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const updateVolumeDefinitionMutation = useMutation({
    mutationKey: ['updateVolumeDefinition'],
    mutationFn: (data: VolumeDefinitionModify) => updateVolumeDefinition(currentDefinition?.name ?? '', 0, data),
    onSuccess: () => {
      vdPropertyFormRef.current?.closeModal();
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

    setSearchKey('');
    refetch();
  };

  const handleConnectStatusDisplay = (resourceItem: ResourceDataType) => {
    let failStr = '';
    const conn = resourceItem?.layer_object?.drbd?.connections || {};
    if (Object.keys(conn).length === 0) {
      return 'OK';
    }
    let count = 0;
    let fail = false;
    for (const nodeName in conn) {
      count++;
      if (!conn?.[nodeName]?.connected) {
        fail = true;
        if (failStr !== '') {
          failStr += ',';
        }
        failStr += `${nodeName} ${conn?.[nodeName]?.message}`;
      }
    }
    fail = count === 0 ? true : fail;
    failStr = fail ? failStr : 'OK';
    return failStr;
  };

  const calculatePercentage = (allocated: number = 0, total: number = 0): string => {
    if (total === 0) return '0.00';
    const percentage = (allocated / total) * 100;
    return Math.min(percentage, 100).toFixed(2);
  };

  const CSProps = Array.from(
    new Set(
      resourceDefinitionList?.flatMap((item) => Object.keys(item.props ?? {}).filter((key) => key.startsWith('Aux'))),
    ),
  );

  const columns: NonNullable<TableProps<OverviewRow>['columns']> = [
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
        const url =
          mode === UIMode.HCI
            ? `/hci/storage-configuration/resource-groups?resource_groups=${resource_group_name}`
            : `/storage-configuration/resource-groups?resource_groups=${resource_group_name}`;

        return <Link to={url}>{resource_group_name}</Link>;
      },
    },
    {
      title: t('common:layers'),
      key: 'layers',
      render: (_, record) => {
        return (
          <Flex gap="4px 0" wrap>
            {record?.layer_data?.map((layer, index) => {
              return (
                <Tag key={index} color={TAG_COLORS[index]} bordered={false}>
                  <span className="text-[var(--text-on-brand)]">{layer.type}</span>
                </Tag>
              );
            })}
          </Flex>
        );
      },
    },
    {
      title: t('common:state'),
      key: 'state',
      render: (_, rd) => {
        const isResizing = rd.volumeDefinitions?.some((vd) =>
          vd.flags?.some((flag: string) => flag.includes('RESIZE')),
        );

        if (isResizing) {
          return <Tag color="orange">RESIZING</Tag>;
        }

        const stateOfResources = rd.volumes?.map((e) => handleConnectStatusDisplay(e.resource));

        const isAllOK = stateOfResources?.every((e) => e === 'OK');

        // Filter out 'OK' and remove duplicates before joining
        const uniqueNonOKStates = Array.from(new Set(stateOfResources?.filter((e) => e !== 'OK')));

        return <Tag color={isAllOK ? 'green' : 'red'}>{isAllOK ? 'OK' : uniqueNonOKStates.join(',')}</Tag>;
      },
    },
    {
      title: () => (
        <Tooltip title={t('common:action')}>
          <span className="flex justify-center">
            <LiaToolsSolid className="w-4 h-4" />
          </span>
        </Tooltip>
      ),
      key: 'action',
      width: 10,
      fixed: 'right',
      render: (_, record) => {
        const isUsingZFS = record.volumes?.every((e) => e.provider_kind === 'ZFS');
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'add_to_node',
                  label: t('resource:add_to_node'),
                  onClick: () => {
                    setCurrentResource(record.name);
                    const nodes = record.volumes?.map((v) => v.node_name) || [];
                    setUsedNodes(Array.from(new Set(nodes.filter((n): n is string => Boolean(n)))));
                    setAddToNodeModalOpen(true);
                  },
                },
                {
                  key: 'adjust',
                  label: (
                    <Popconfirm
                      title={t('resource:adjust_resource')}
                      description={t('resource:are_you_sure_adjust_resource')}
                      onConfirm={() => {
                        adjustResourceGroupMutation.mutate({
                          resource_group: record.resource_group_name ?? '',
                        });
                      }}
                    >
                      <div className="w-full">{t('common:adjust')}</div>
                    </Popconfirm>
                  ),
                },
                {
                  key: 'clone',
                  label: <CloneForm resource={record.name ?? ''} isUsingZFS={isUsingZFS} />,
                },
                {
                  key: 'resize',
                  label: t('common:resize'),
                  onClick: () => {
                    setCurrentDefinition(record);
                    setResizeModalOpen(true);
                  },
                },
                {
                  key: 'resource_definition',
                  label: t('common:resource_definition_properties'),
                  onClick: () => {
                    setCurrentDefinition(record);
                    setInitialProps(record.props ?? {});
                    rdPropertyFormRef.current?.openModal();
                  },
                },
                {
                  key: 'volume_definition',
                  label: t('common:volume_definition_properties'),
                  // A definition created without a size has no volume
                  // definition to edit; reading [0] of it used to throw.
                  disabled: record.volumeDefinitions.length === 0,
                  onClick: () => {
                    setCurrentDefinition(record);
                    setInitialProps(record.volumeDefinitions[0]?.props ?? {});
                    vdPropertyFormRef.current?.openModal();
                  },
                },
                {
                  key: 'delete',
                  label: (
                    <Popconfirm
                      key="delete"
                      title={t('resource:delete_resource_definition')}
                      description={t('resource:are_you_sure_delete_resource')}
                      onConfirm={() => {
                        deleteMutation.mutate(record.name ?? '');
                      }}
                    >
                      <div className="w-full text-red-600">{t('common:delete')}</div>
                    </Popconfirm>
                  ),
                },
              ],
            }}
          >
            <span className="cursor-pointer text-gray-600 hover:text-gray-800 flex items-center justify-center w-8 h-8">
              <MoreOutlined style={{ fontSize: 18 }} />
            </span>
          </Dropdown>
        );
      },
    },
  ];

  const handlePaginationChange = useCallback((pagination: TablePaginationConfig) => {
    setPagination(pagination);
  }, []);

  // Aux/* properties get a column of their own when a row on this page has one.
  // Built every render like `columns`; the memos that used to wrap these never
  // held, since their inputs are new objects each time.
  const pageSize = pagination.pageSize ?? 10;
  const currentPage = pagination.current ?? 1;
  const currentData = filteredList?.slice(pageSize * (currentPage - 1), pageSize * currentPage);
  const shouldShowCSProps = currentData?.some((e) => CSProps.some((key) => e.props?.[key]));
  const extra = shouldShowCSProps
    ? CSProps.map((e) => ({
        title: e,
        key: e,
        render: (item: OverviewRow) => <span>{item?.props?.[e]}</span>,
      }))
    : [];

  const finalColumns = isLargeScreen ? [...columns.slice(0, -1), ...extra, columns[columns.length - 1]] : columns;

  const tablePagination = useMemo(() => {
    return {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50', '100', '200'],
      showTotal: (total: number) => t('common:total_items', { total }),
    };
  }, [t]);

  const expandableRender = (record: OverviewRow) => {
    const subTableColumns: SubTableColumns = [
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
              {calculatePercentage(record.allocated_size_kib, record.size_kib)}%)
            </span>
          );
        },
      },
      {
        title: t('common:storage_pool'),
        key: 'storage_pool',
        dataIndex: 'storage_pool_name',
        render: (storage_pool_name) => {
          const url =
            mode === UIMode.HCI
              ? `/hci/inventory/storage-pools?storage_pools=${storage_pool_name}`
              : `/inventory/storage-pools?storage_pools=${storage_pool_name}`;

          return <Link to={url}>{storage_pool_name}</Link>;
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
        render: (_, record) => {
          const isPrimaryNode = record?.node_name?.toLowerCase() === record?.primary_node?.toLowerCase();
          const stateStr = getResourceState(record.resource, record.volume_number);
          const isInconsistent = stateStr?.includes('Inconsistent');
          return (
            <>
              <Tag color={isInconsistent ? 'red' : 'geekblue'}>{stateStr}</Tag>
              {isPrimaryNode && <Tag color="cyan">{t('common:primary')}</Tag>}
            </>
          );
        },
      },
      {
        title: 'Stats',
        key: 'stats',
        width: 10,
        align: 'center',
        render: (_, record) => {
          const statsIcon = (
            <LineChartOutlined
              onClick={() => handleStatsClick(record.node_name ?? '', record.resource_name ?? '')}
              style={{
                color: grafanaConfig?.enable ? '#1890ff' : '#d9d9d9',
                cursor: grafanaConfig?.enable ? 'pointer' : 'not-allowed',
              }}
              disabled={!grafanaConfig?.enable}
            />
          );

          if (!grafanaConfig?.enable) {
            return (
              <Tooltip title={t('resource:please_enable_configure_grafana')} placement="top">
                {statsIcon}
              </Tooltip>
            );
          }

          return statsIcon;
        },
      },
      {
        title: () => (
          <Tooltip title={t('common:action')}>
            <span className="flex justify-center">
              <LiaToolsSolid className="w-4 h-4" />
            </span>
          </Tooltip>
        ),
        key: 'action',
        width: 10,
        fixed: 'right',
        align: 'center',
        render: (_, record) => {
          const isDisklessOrTieBreaker =
            record.flags && (record.flags.includes('DRBD_DISKLESS') || record.flags.includes('TIE_BREAKER'));

          return (
            <>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'toggle',
                      label: (
                        <Popconfirm
                          title={t('resource:toggle_resource')}
                          description={t('resource:are_you_sure_toggle_resource')}
                          onConfirm={() => {
                            toggleResourceMutation.mutate({
                              resource: record.resource_name ?? '',
                              node: record.node_name ?? '',
                              action: isDisklessOrTieBreaker ? 'to_diskful' : 'to_diskless',
                            });
                          }}
                        >
                          <div className="w-full">
                            {isDisklessOrTieBreaker ? t('resource:add_disk') : t('resource:remove_disk')}
                          </div>
                        </Popconfirm>
                      ),
                    },
                    {
                      key: 'property',
                      label: t('common:property'),
                      onClick: () => {
                        setCurrentResource_({
                          resource_name: record.resource_name,
                          node_name: record.node_name,
                        });

                        const currentData = record?.resource.props;
                        setInitialProps({
                          ...currentData,
                          name: record?.resource_name,
                        });
                        resourcePropertyFormRef.current?.openModal();
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
                          title={t('resource:delete_resource')}
                          description={t('resource:are_you_sure_delete_resource_2')}
                          onConfirm={() => {
                            deleteResourceMutation.mutate({
                              resource: record.resource_name ?? '',
                              node: record.node_name ?? '',
                            });
                          }}
                        >
                          <div className="w-full text-red-600">{t('common:delete')}</div>
                        </Popconfirm>
                      ),
                    },
                  ],
                }}
              >
                <span className="cursor-pointer text-gray-600 hover:text-gray-800 flex items-center justify-center w-8 h-8">
                  <MoreOutlined style={{ fontSize: 18 }} />
                </span>
              </Dropdown>
            </>
          );
        },
      },
    ];

    return <ExpandableSubTable volumes={record.volumes ?? []} columns={subTableColumns} />;
  };

  return (
    <div className="overflow-x-auto relative">
      <SearchForm>
        <Form form={form} name="storage_pool_search" layout="inline">
          <Form.Item
            name="name"
            label={
              <>
                {t('common:name')}
                <Tooltip title={t('resource:search_placeholder')}>
                  <QuestionCircleOutlined style={{ marginLeft: 5 }} />
                </Tooltip>
              </>
            }
          >
            <Input
              placeholder={t('resource:search_placeholder')}
              onChange={onSearchInputChange}
              onPressEnter={(e) => setSearchKey(e.currentTarget.value)}
            />
          </Form.Item>

          <Form.Item name="resource_group" label={t('common:resource_group')}>
            <Select
              showSearch
              allowClear
              style={{ width: 200 }}
              options={uniqBy(
                resourceDefinitionList?.map((e) => ({
                  label: e.resource_group_name,
                  value: e.resource_group_name,
                })) || [],
                'value',
              )}
              placeholder={t('common:select_resource_group')}
            />
          </Form.Item>

          <Form.Item>
            <Space size="small">
              <Button type="secondary" onClick={handleReset}>
                {t('common:reset')}
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Space>
          {/* Quick path: spawn a fully-deployed resource from a resource group. */}
          <SpawnForm />

          {/* Advanced path: create the Resource Definition / Volume Definition /
              Resource by hand. */}
          <Dropdown
            menu={{
              items: [
                {
                  key: '1',
                  label: `${t('common:create')} ${t('common:resource_definition')}`,
                  onClick: () => {
                    navigate(
                      mode === UIMode.HCI
                        ? `/hci/storage-configuration/resource-definitions/create`
                        : `/storage-configuration/resource-definitions/create`,
                    );
                  },
                },
                {
                  key: '2',
                  label: <CreateForm refetch={refetch} simple />,
                },
                {
                  key: '3',
                  label: `${t('common:create')} ${t('common:resource')}`,
                  onClick: () => {
                    navigate(
                      mode === UIMode.HCI
                        ? `/hci/storage-configuration/resources/create`
                        : `/storage-configuration/resources/create`,
                    );
                  },
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button type="secondary">
              {t('common:advanced')} <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </SearchForm>

      <br />

      <Table
        loading={isLoading}
        columns={finalColumns}
        expandable={{
          expandedRowRender: expandableRender,
          rowExpandable: (record) => (record?.volumes?.length ?? 0) > 0,
        }}
        dataSource={filteredList}
        rowKey={(item) => item?.name ?? uniqId()}
        pagination={tablePagination}
        onChange={handlePaginationChange}
        scroll={{ x: 'max-content' }}
      />

      <PropertyForm
        ref={rdPropertyFormRef}
        initialVal={initialProps}
        type="resource-definition"
        handleSubmit={(data) => updateResourceDefinitionMutation.mutate(data)}
      />

      <PropertyForm
        ref={vdPropertyFormRef}
        initialVal={initialProps}
        type="volume-definition"
        handleSubmit={(data) => updateVolumeDefinitionMutation.mutate(data)}
      />

      <PropertyForm
        ref={resourcePropertyFormRef}
        initialVal={initialProps}
        type="resource"
        handleSubmit={(data) => updateResourceMutation.mutate(data)}
      />

      <AddToNodeModal
        open={addToNodeModalOpen}
        onClose={() => setAddToNodeModalOpen(false)}
        resourceName={currentResource ?? ''}
        usedNodes={usedNodes}
        onSuccess={() => {
          refetch();
        }}
      />

      <ResizeVolumeModal
        open={resizeModalOpen}
        onClose={() => setResizeModalOpen(false)}
        resourceName={currentDefinition?.name ?? ''}
        onSuccess={() => {
          refetch();
        }}
      />

      <Modal
        title={t('resource:create_snapshot')}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateSnapShot}
      >
        <Input
          type="text"
          placeholder={t('resource:please_input_snapshot_name')}
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
    </div>
  );
};
