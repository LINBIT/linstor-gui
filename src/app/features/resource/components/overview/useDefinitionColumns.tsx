// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Flex, Dropdown } from 'antd';
import { Tag } from '@app/components/Tag';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { MoreOutlined } from '@ant-design/icons';

import { Link } from '@app/components/Link';
import { Popconfirm } from '@app/components/Popconfirm';
import { ActionColumnTitle } from '@app/components/ActionColumnTitle';
import { UIMode } from '@app/features/settings/types';
import { connectionStatus, diskProblem } from './rows';
import type { OverviewRow } from './types';

type DefinitionColumns = NonNullable<TableProps<OverviewRow>['columns']>;

export interface DefinitionActions {
  onEdit: (record: OverviewRow) => void;
  onAddToNode: (record: OverviewRow) => void;
  onAdjust: (record: OverviewRow) => void;
  onClone: (record: OverviewRow) => void;
  onResize: (record: OverviewRow) => void;
  onDefinitionProperties: (record: OverviewRow) => void;
  onVolumeDefinitionProperties: (record: OverviewRow) => void;
  onDelete: (record: OverviewRow) => void;
}

/** The definition table's columns; the last one is the per-definition menu. */
export const useDefinitionColumns = (mode: UIMode | undefined, actions: DefinitionActions) => {
  const { t } = useTranslation(['volume', 'common', 'resource']);

  const columns: DefinitionColumns = [
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
              return <Tag key={index}>{layer.type}</Tag>;
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
          return <Tag tone="warning">RESIZING</Tag>;
        }

        // Nothing to be healthy yet: the definition was never placed, or lost every resource.
        if (rd.resourceCount === 0) {
          return <Tag>{t('resource:no_resources_placed')}</Tag>;
        }

        // A replica whose disk is not usable, or a broken DRBD connection, keeps the row from being OK.
        const disks = (rd.volumes ?? []).map(diskProblem).filter((p) => p !== null);
        const connections = (rd.volumes ?? []).map((e) => connectionStatus(e.resource)).filter((s) => s !== 'OK');
        const problems = Array.from(new Set([...disks.map((p) => p.text), ...connections]));

        if (problems.length === 0) {
          return <Tag tone="success">OK</Tag>;
        }
        const isDanger = connections.length > 0 || disks.some((p) => p.tone === 'danger');
        return <Tag tone={isDanger ? 'danger' : 'warning'}>{problems.join(',')}</Tag>;
      },
    },
    {
      title: () => <ActionColumnTitle />,
      key: 'action',
      width: 10,
      fixed: 'right',
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: t('common:edit'),
                  onClick: () => actions.onEdit(record),
                },
                {
                  key: 'add_to_node',
                  label: t('resource:add_to_node'),
                  onClick: () => actions.onAddToNode(record),
                },
                {
                  key: 'adjust',
                  label: (
                    <Popconfirm
                      title={t('resource:adjust_resource')}
                      description={t('resource:are_you_sure_adjust_resource')}
                      onConfirm={() => actions.onAdjust(record)}
                    >
                      <div className="w-full">{t('common:adjust')}</div>
                    </Popconfirm>
                  ),
                },
                {
                  key: 'clone',
                  label: t('common:clone'),
                  onClick: () => actions.onClone(record),
                },
                {
                  key: 'resize',
                  label: t('common:resize'),
                  onClick: () => actions.onResize(record),
                },
                {
                  key: 'resource_definition',
                  label: t('common:resource_definition_properties'),
                  onClick: () => actions.onDefinitionProperties(record),
                },
                {
                  key: 'volume_definition',
                  label: t('common:volume_definition_properties'),
                  // A definition created without a size has no volume
                  // definition to edit; reading [0] of it used to throw.
                  disabled: record.volumeDefinitions.length === 0,
                  onClick: () => actions.onVolumeDefinitionProperties(record),
                },
                {
                  key: 'delete',
                  danger: true,
                  label: (
                    <Popconfirm
                      key="delete"
                      title={t('resource:delete_resource_definition')}
                      description={t('resource:are_you_sure_delete_resource', { name: record.name })}
                      onConfirm={() => actions.onDelete(record)}
                    >
                      <div className="w-full">{t('common:delete')}</div>
                    </Popconfirm>
                  ),
                },
              ],
            }}
          >
            <span className="cursor-pointer text-(--icon-subtle) hover:text-(--icon-default) flex items-center justify-center w-8 h-8">
              <MoreOutlined className="text-[18px]" />
            </span>
          </Dropdown>
        );
      },
    },
  ];

  return columns;
};

/**
 * Aux/* properties get a column of their own when a row on this page has one,
 * placed before the menu column, and only on a large screen.
 */
export const withAuxColumns = (
  columns: DefinitionColumns,
  auxKeys: string[],
  pageRows: OverviewRow[] | undefined,
  isLargeScreen: boolean,
): DefinitionColumns => {
  const shouldShowCSProps = pageRows?.some((e) => auxKeys.some((key) => e.props?.[key]));
  const extra = shouldShowCSProps
    ? auxKeys.map((e) => ({
        title: e,
        key: e,
        render: (item: OverviewRow) => <span>{item?.props?.[e]}</span>,
      }))
    : [];

  return isLargeScreen ? [...columns.slice(0, -1), ...extra, columns[columns.length - 1]] : columns;
};
