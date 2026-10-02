// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useRef } from 'react';
import { Table, Tag, Dropdown, Tooltip, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LineChartOutlined, MoreOutlined } from '@ant-design/icons';

import { formatBytes } from '@app/utils/size';
import { Link } from '@app/components/Link';
import { Popconfirm } from '@app/components/Popconfirm';
import { ActionColumnTitle } from '@app/components/ActionColumnTitle';
import { deletingRowClass } from '@app/hooks/useDeleteAction';
import { UIMode } from '@app/features/settings/types';
import { useSettings } from '@app/features/settings/useSettings';
import { getResourceState } from '@app/utils/resource';
import { SyncFlowOverlay } from '../SyncFlowOverlay';
import { calculatePercentage, connectionStatus } from './rows';
import type { OverviewVolume, SubTableColumns } from './types';

interface ExpandableSubTableProps {
  volumes: OverviewVolume[];
  columns: SubTableColumns;
  isDeleting: (row: OverviewVolume) => boolean;
}

// Permanent left gutter that hosts the SyncFlowOverlay's arrows. Kept at a
// fixed width regardless of sync state so the table layout never jumps.
const SYNC_LANE_WIDTH = 96;

const ExpandableSubTable: React.FC<ExpandableSubTableProps> = ({ volumes, columns, isDeleting }) => {
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
          return [isPrimaryNode ? 'ant-table-row-primary' : '', isDeleting(row) ? deletingRowClass : '']
            .filter(Boolean)
            .join(' ');
        }}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <SyncFlowOverlay containerRef={containerRef} volumes={volumes} />
    </div>
  );
};

export interface NodeVolumesTableProps {
  volumes: OverviewVolume[];
  isDeleting: (row: OverviewVolume) => boolean;
  onToggleDisk: (row: OverviewVolume, action: 'to_diskless' | 'to_diskful') => void;
  onProperties: (row: OverviewVolume) => void;
  onSnapshot: (resource: string) => void;
  onMigrate: (resource: string, node: string) => void;
  onDelete: (row: OverviewVolume) => void;
}

/** A definition's expanded row: one line per deployed volume, with its per-node menu. */
export const NodeVolumesTable: React.FC<NodeVolumesTableProps> = ({
  volumes,
  isDeleting,
  onToggleDisk,
  onProperties,
  onSnapshot,
  onMigrate,
  onDelete,
}) => {
  const { t } = useTranslation(['volume', 'common']);
  const navigate = useNavigate();
  const { mode, grafanaConfig } = useSettings();
  const grafanaEnabled = grafanaConfig?.enable;

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
        const status = connectionStatus(record?.resource);
        return <Tag color={status === 'OK' ? 'green' : 'red'}>{status}</Tag>;
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
              color: grafanaEnabled ? '#1890ff' : '#d9d9d9',
              cursor: grafanaEnabled ? 'pointer' : 'not-allowed',
            }}
            disabled={!grafanaEnabled}
          />
        );

        if (!grafanaEnabled) {
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
      title: () => <ActionColumnTitle />,
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
                          onToggleDisk(record, isDisklessOrTieBreaker ? 'to_diskful' : 'to_diskless');
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
                    onClick: () => onProperties(record),
                  },
                  {
                    key: 'snapshot',
                    label: t('common:snapshot'),
                    onClick: () => {
                      onSnapshot(record.resource_name ?? '');
                    },
                  },
                  {
                    key: 'migrate',
                    label: t('common:migrate'),
                    onClick: () => {
                      onMigrate(record.resource_name ?? '', record.node_name ?? '');
                    },
                  },
                  {
                    key: 'delete',
                    label: (
                      <Popconfirm
                        key="delete"
                        title={t('resource:delete_resource')}
                        description={t('resource:are_you_sure_delete_resource_2')}
                        onConfirm={() => onDelete(record)}
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

  return <ExpandableSubTable volumes={volumes} columns={subTableColumns} isDeleting={isDeleting} />;
};
