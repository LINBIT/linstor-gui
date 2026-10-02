// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal, Dropdown, MenuProps, message } from 'antd';
import { MoreOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';
import type { useUnmanageHA } from './useHA';
import { type HARecord, getConfigName, reactorConfigFiles } from './haStatus';

interface HARowActionsProps {
  record: HARecord;
  getPrimaryNode: (resourceName: string) => string | null;
  isResourceActive: (resourceName: string) => boolean;
  onEvict: (record: HARecord) => void;
  onStop: (record: HARecord) => void;
  onStart: (record: HARecord) => void;
  onDelete: (record: HARecord) => void;
  unmanageMutation: ReturnType<typeof useUnmanageHA>;
}

/** A row's menu: edit, evict, stop/start, unmanage and delete, each confirmed. */
export const HARowActions: React.FC<HARowActionsProps> = ({
  record,
  getPrimaryNode,
  isResourceActive,
  onEvict,
  onStop,
  onStart,
  onDelete,
  unmanageMutation,
}) => {
  const { t } = useTranslation(['ha', 'common']);
  const navigate = useNavigate();

  const configFiles = reactorConfigFiles(record);
  const editPath =
    configFiles.length > 0 ? `/reactor/edit/${record.name}?filePath=${encodeURIComponent(configFiles[0])}` : '';

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: t('common:edit'),
      disabled: !editPath,
      onClick: () => editPath && navigate(editPath),
    },
    { type: 'divider' },
    {
      key: 'evict',
      label: 'Evict',
      disabled: !getPrimaryNode(record.name) || !getConfigName(record),
      onClick: () => {
        const activeNode = getPrimaryNode(record.name);
        const configName = getConfigName(record);
        if (!activeNode || !configName) return;

        const modal = Modal.confirm({
          title: 'Evict Resource',
          content: `Evict configuration "${configName}" from active node "${activeNode}"? This will trigger failover.`,
          footer: (
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
              <Button
                danger
                onClick={() => {
                  modal.destroy();
                  onEvict(record);
                }}
              >
                Evict
              </Button>
            </div>
          ),
        });
      },
    },
    {
      key: 'stop',
      label: (() => {
        const isActive = isResourceActive(record.name);
        return isActive ? t('common:stop') : t('common:start');
      })(),
      disabled: !getConfigName(record),
      onClick: () => {
        const isActive = isResourceActive(record.name);
        const configName = getConfigName(record);
        if (!configName) return;

        const modal = Modal.confirm({
          title: isActive ? 'Stop Resource' : 'Start Resource',
          content: isActive
            ? `Stop configuration "${configName}"? This will disable the HA service on all nodes.`
            : `Start configuration "${configName}"? This will enable the HA service on all nodes.`,
          footer: (
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
              <Button
                type="primary"
                danger={isActive}
                onClick={() => {
                  modal.destroy();
                  if (isActive) {
                    onStop(record);
                  } else {
                    onStart(record);
                  }
                }}
              >
                {isActive ? t('common:stop') : t('common:start')}
              </Button>
            </div>
          ),
        });
      },
    },
    {
      key: 'unmanage',
      label: 'Unmanage',
      disabled: configFiles.length === 0,
      onClick: () => {
        if (configFiles.length === 0) return;
        const filePath = configFiles[0].replace('files', '');
        const modal = Modal.confirm({
          title: 'Unmanage Resource',
          content: `Stop LINSTOR from managing the HA configuration for "${record.name}"? The configuration file will remain on disk but LINSTOR will no longer track or sync it.`,
          footer: (
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
              <Button
                type="primary"
                onClick={() => {
                  unmanageMutation.mutate(
                    { resourceName: record.name, filePath },
                    {
                      onSuccess: () => {
                        message.success(`"${record.name}" is no longer managed by LINSTOR`);
                        modal.destroy();
                      },
                      onError: (err) => {
                        message.error(`Failed to unmanage: ${err instanceof Error ? err.message : err}`);
                        modal.destroy();
                      },
                    },
                  );
                }}
              >
                Unmanage
              </Button>
            </div>
          ),
        });
      },
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: <span className="text-red-600">{t('common:delete')}</span>,
      icon: (
        <span className="text-red-600">
          <DeleteOutlined />
        </span>
      ),
      onClick: () => {
        if (configFiles.length > 0) {
          onDelete(record);
        } else {
          message.warning('No configuration file found to delete');
        }
      },
    },
  ];

  return (
    <Dropdown menu={{ items }}>
      <span className="cursor-pointer text-(--icon-subtle) hover:text-(--icon-default)">
        <MoreOutlined />
      </span>
    </Dropdown>
  );
};
