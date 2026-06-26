// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Space, Table, Flex, Tag, Dropdown, Popconfirm, Modal, Tooltip } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { Link } from '@app/components/Link';
import type { TableProps } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { uniqBy } from 'lodash';
import { LineChartOutlined, MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { LiaToolsSolid } from 'react-icons/lia';

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
  ResizeVolumeModal,
} from '@app/features/resourceDefinition';
import { CreateForm } from '@app/features/volumeDefinition';
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
import { GetResourcesResponseBody, ResourceDataType, ResourceModifyRequestBody } from '../types';
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

interface ExpandableSubTableProps {
  volumes: any[];
  columns: any[];
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
        rowKey={(item: any) => `${item?.node_name}:${item?.volume_number ?? 0}`}
        rowClassName={(row: any) => {
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

type SyncFlow = {
  direction: 'in' | 'out';
  percent: number | null;
  peers: string[];
};

const getSyncFlow = (record: any): SyncFlow | null => {
  const diskState = record?.state?.disk_state;
  const ACTIVE_FLOW_STATES = new Set(['SyncTarget', 'SyncSource', 'Inconsistent', 'Outdated']);
  if (!diskState || !ACTIVE_FLOW_STATES.has(diskState)) {
    return null;
  }

  const replicationStates = record?.state?.replication_states ?? {};
  const peerEntries = Object.entries(replicationStates) as Array<
    [string, { replication_state?: string; done_percentage?: number } | undefined]
  >;

  const matchingPeers = peerEntries.filter(([, state]) => state?.replication_state === diskState);
  const peers = matchingPeers.map(([peer]) => peer);
  const percentages = matchingPeers
    .map(([, state]) => state?.done_percentage)
    .filter((value): value is number => typeof value === 'number');

  return {
    direction: diskState === 'SyncTarget' ? 'in' : 'out',
    // Use the slowest in-progress peer to represent overall sync progress.
    percent: percentages.length > 0 ? Math.min(...percentages) : null,
    peers,
  };
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
  const [resourceDefinitionList, setResourceDefinitionList] = useState<any>();
  const [current, setCurrent] = useState<any>();
  const [initialProps, setInitialProps] = useState<Record<string, unknown>>();

  const rdPropertyFormRef = useRef<PropertyFormRef>(null);
  const vdPropertyFormRef = useRef<PropertyFormRef>(null);
  const resourcePropertyFormRef = useRef<PropertyFormRef>(null);

  const [searchKey, setSearchKey] = useState<string>('');
  const [filteredList, setFilteredList] = useState<GetResourcesResponseBody>();
  const [pagination, setPagination] = useState<any>({
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
    } as any);

    return data?.data ?? [];
  };

  const fetchResourcesView = async () => {
    const t0 = performance.now();
    const data = (await getResources()).data ?? [];
    // Temporary diagnostic to verify sync-progress polling cadence.
    // Logs each /v1/view/resources poll: timing + first non-null done_percentage seen.
    if (typeof console !== 'undefined') {
      const sample: Array<string> = [];
      for (const r of data as any[]) {
        for (const v of r?.volumes ?? []) {
          const rs = v?.state?.replication_states;
          if (!rs) continue;
          for (const [peer, info] of Object.entries(rs)) {
            const pct = (info as any)?.done_percentage;
            if (typeof pct === 'number') {
              sample.push(`${r.node_name}->${peer}=${pct.toFixed(2)}`);
            }
          }
        }
      }
      console.log(
        `[sync-poll] t=${new Date().toISOString()} elapsed=${(performance.now() - t0).toFixed(0)}ms ${sample.join(' ')}`,
      );
    }
    return data;
  };

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
    return resourceDefinitions.map((resource: any) => {
      const { name, volume_definitions: volumeDefinitions } = resource;

      const resourceWithVolumes = {
        ...resource,
        volumes: [] as any[],
        volumeDefinitions: volumeDefinitions || [],
      };

      resourceWithVolumes.volumes =
        resourcesView
          ?.filter((e: any) => e.name === name)
          ?.flatMap(
            (e: any) =>
              e.volumes?.map((v: any) => {
                const matchingVolume = volumeDefinitions?.find((vd: any) => vd.volume_number === v.volume_number);
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
          ) ?? [];

      return resourceWithVolumes;
    });
  }, [resourceDefinitions, resourcesView]);

  useEffect(() => {
    setResourceDefinitionList(mergedResourceDefinitionList);
  }, [mergedResourceDefinitionList]);

  const hasSyncingVolume = useMemo(() => {
    return Boolean(
      resourceDefinitionList?.some((rd: any) => rd?.volumes?.some((volume: any) => getSyncFlow(volume) !== null)),
    );
  }, [resourceDefinitionList]);

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
      return resourceModify(current?.resource_name ?? '', current?.node_name ?? '', data);
    },
    onSuccess: () => {
      resourcePropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const updateResourceDefinitionMutation = useMutation({
    mutationKey: ['updateResourceDefinition'],
    mutationFn: (data: UpdateResourceDefinitionRequestBody) =>
      updateResourceDefinition(current?.name ?? '', data as any),
    onSuccess: () => {
      rdPropertyFormRef.current?.closeModal();
      refetch();
    },
  });

  const updateVolumeDefinitionMutation = useMutation({
    mutationKey: ['updateVolumeDefinition'],
    mutationFn: (data: VolumeDefinitionModify) => updateVolumeDefinition(current?.name ?? '', 0, data as any),
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
      resourceDefinitionList?.flatMap((item: any) =>
        Object.keys(item.props ?? {}).filter((key) => key.startsWith('Aux')),
      ),
    ),
  );

  const columns: TableProps<any>['columns'] = useMemo(() => {
    return [
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
              {record?.layer_data?.map(
                (
                  layer: {
                    type: string;
                  },
                  index: number,
                ) => {
                  return (
                    <Tag key={index} color={TAG_COLORS[index]} bordered={false}>
                      <span className="text-black">{layer.type}</span>
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
          const isResizing = rd.volumeDefinitions?.some((vd: any) =>
            vd.flags?.some((flag: string) => flag.includes('RESIZE')),
          );

          if (isResizing) {
            return <Tag color="orange">RESIZING</Tag>;
          }

          const stateOfResources = rd.volumes?.map((e: any) => handleConnectStatusDisplay(e.resource));

          const isAllOK = stateOfResources?.every((e: any) => e === 'OK');

          // Filter out 'OK' and remove duplicates before joining
          const uniqueNonOKStates = Array.from(new Set(stateOfResources?.filter((e: any) => e !== 'OK')));

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
          const isUsingZFS = record.volumes?.every((e: any) => e.provider_kind === 'ZFS');
          return (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'add_to_node',
                    label: t('resource:add_to_node'),
                    onClick: () => {
                      setCurrentResource(record.name);
                      const nodes = record.volumes?.map((v: any) => v.node_name) || [];
                      setUsedNodes(Array.from(new Set(nodes)));
                      setAddToNodeModalOpen(true);
                    },
                  },
                  {
                    key: 'adjust',
                    label: (
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
                        <div className="w-full">{t('common:adjust')}</div>
                      </Popconfirm>
                    ),
                  },
                  {
                    key: 'clone',
                    label: <CloneForm resource={record.name} isUsingZFS={isUsingZFS} />,
                  },
                  {
                    key: 'resize',
                    label: t('common:resize'),
                    onClick: () => {
                      setCurrent(record);
                      setResizeModalOpen(true);
                    },
                  },
                  {
                    key: 'resource_definition',
                    label: t('common:resource_definition_properties'),
                    onClick: () => {
                      setCurrent(record);
                      setInitialProps(record.props ?? {});
                      rdPropertyFormRef.current?.openModal();
                    },
                  },
                  {
                    key: 'volume_definition',
                    label: t('common:volume_definition_properties'),
                    onClick: () => {
                      setCurrent(record);
                      setInitialProps(record.volumeDefinitions[0].props ?? {});
                      vdPropertyFormRef.current?.openModal();
                    },
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
  }, [adjustResourceGroupMutation, deleteMutation, navigate, t]);

  const handlePaginationChange = useCallback((pagination: any) => {
    setPagination(pagination);
  }, []);

  const extra = useMemo(() => {
    const currentData = filteredList?.slice(
      pagination.pageSize * (pagination.current - 1),
      pagination.pageSize * pagination.current,
    );

    const shouldShowCSProps = currentData?.some((e) => {
      return CSProps.some((key: any) => e.props?.[key]);
    });

    if (shouldShowCSProps) {
      return [
        ...(CSProps?.map((e: any) => {
          return {
            title: e,
            key: e,
            render: (item: any) => {
              return <span>{item?.props?.[e]}</span>;
            },
          };
        }) ?? []),
      ];
    } else {
      return [];
    }
  }, [CSProps, filteredList, pagination]);

  const finalColumns = useMemo(() => {
    if (isLargeScreen) {
      const columnsWithoutLast = columns.slice(0, -1);
      const lastColumn = columns[columns.length - 1];

      return [...columnsWithoutLast, ...extra, lastColumn];
    } else {
      return columns;
    }
  }, [columns, extra, isLargeScreen]);

  const tablePagination = useMemo(() => {
    return {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50', '100', '200'],
      showTotal: (total: number) => t('common:total_items', { total }),
    };
  }, []);

  const expandableRender = (record: any) => {
    const subTableColumns = [
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
        render: (_, record: any) => {
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
        render: (state, record) => {
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
              onClick={() => handleStatsClick(record.node_name, record.resource_name)}
              style={{
                color: grafanaConfig?.enable ? '#1890ff' : '#d9d9d9',
                cursor: grafanaConfig?.enable ? 'pointer' : 'not-allowed',
              }}
              disabled={!grafanaConfig?.enable}
            />
          );

          if (!grafanaConfig?.enable) {
            return (
              <Tooltip title="Please enable and configure Grafana Dashboard in Settings to view stats" placement="top">
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
                          title="Toggle the resource"
                          description="Are you sure to toggle this resource?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => {
                            toggleResourceMutation.mutate({
                              resource: record.resource_name,
                              node: record.node_name,
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
                resourceDefinitionList?.map((e: any) => ({
                  label: e.resource_group_name,
                  value: e.resource_group_name,
                })) || [],
                'value',
              )}
              placeholder="Select a resource group"
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

        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                label: t('common:resource_definition'),
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
                label: t('common:resource'),
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
          <Button type="secondary">+ {t('common:add')}</Button>
        </Dropdown>
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
        resourceName={current?.name ?? ''}
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
    </div>
  );
};
