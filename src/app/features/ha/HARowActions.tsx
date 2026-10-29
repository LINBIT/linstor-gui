// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal, Dropdown, MenuProps, message } from 'antd';
import { MoreOutlined, DeleteOutlined, PoweroffOutlined, SwapOutlined } from '@ant-design/icons';
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
      label: t('ha:evict'),
      disabled: !getPrimaryNode(record.name) || !getConfigName(record),
      onClick: () => {
        const activeNode = getPrimaryNode(record.name);
        const configName = getConfigName(record);
        if (!activeNode || !configName) return;

        const modal = Modal.confirm({
          title: t('ha:evict_title'),
          content: t('ha:evict_confirm', { config: configName, node: activeNode }),
          footer: (
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
              {/* An evict moves the services to another node; a danger Button's default trash icon reads as delete. */}
              <Button
                danger
                icon={<SwapOutlined aria-hidden />}
                onClick={() => {
                  modal.destroy();
                  onEvict(record);
                }}
              >
                {t('ha:evict')}
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
          title: isActive ? t('ha:stop_title') : t('ha:start_title'),
          content: isActive
            ? t('ha:stop_confirm', { config: configName })
            : t('ha:start_confirm', { config: configName }),
          footer: (
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => modal.destroy()}>{t('common:cancel')}</Button>
              <Button
                type="primary"
                danger={isActive}
                icon={isActive ? <PoweroffOutlined aria-hidden /> : undefined}
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
      label: t('ha:unmanage'),
      disabled: configFiles.length === 0,
      onClick: () => {
        if (configFiles.length === 0) return;
        const filePath = configFiles[0].replace('files', '');
        const modal = Modal.confirm({
          title: t('ha:unmanage_title'),
          content: t('ha:unmanage_confirm', { name: record.name }),
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
                        message.success(t('ha:unmanaged', { name: record.name }));
                        modal.destroy();
                      },
                      onError: (err) => {
                        message.error(
                          t('ha:unmanage_failed', { error: err instanceof Error ? err.message : String(err) }),
                        );
                        modal.destroy();
                      },
                    },
                  );
                }}
              >
                {t('ha:unmanage')}
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
          message.warning(t('ha:no_config_to_delete'));
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
