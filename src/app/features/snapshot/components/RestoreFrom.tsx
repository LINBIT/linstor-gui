// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// RestoreFrom component: select target resource to restore snapshot to
import React, { useState } from 'react';
import { logger } from '@app/utils/logger';
import { AutoComplete, Form, message, Space } from 'antd';
import { Button } from '@app/components/Button';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { uniqBy } from '@app/utils/collection';
import { getResourcesByResourceName } from '@app/features/resource/api';
import { useInvalidateResourcesView, useResourcesView } from '@app/features/resource/hooks/useResourcesView';
import {
  createResourceDefinition,
  getResourceDefinition,
  getVolumeDefinitionListByResource,
} from '@app/features/resourceDefinition/api';
import { restoreSnapshot, restoreVolumeDefinition } from '../api';
import { withQuietToasts } from '@app/utils/toast';
import { replyError } from '@app/hooks/useDeleteAction';

const RESTORE_MESSAGE_KEY = 'snapshot-restore';

interface RestoreFromProps {
  sourceResource: string; // Source resource name (passed from parent)
  sourceSnapshot: string; // Source snapshot name (passed from parent)
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RestoreFrom: React.FC<RestoreFromProps> = ({ sourceResource, sourceSnapshot, onSuccess, onCancel }) => {
  const { t } = useTranslation(['common', 'snapshot']);
  const [form] = Form.useForm();
  // Free text with the existing resources as suggestions: a name that is not
  // one of them is created. (A tags-mode Select toggled the choice off when
  // its option was picked again.)
  const [targetInput, setTargetInput] = useState('');
  const targetResource = targetInput.trim() || undefined;

  // Fetch resource list for target dropdown
  const { data: resourceList } = useResourcesView();

  // Restore snapshot mutation. Up to three requests make one restore: create the
  // resource definition, restore its volume definitions, restore the data. What
  // is already done is looked up on the target definition itself, not in the
  // resource list (which only lists deployed resources), so a retry after a
  // failed step continues from that step instead of failing on "already
  // exists". The replies are kept quiet and one progress message (same key)
  // walks through the steps and ends as the outcome. openapi-fetch resolves on
  // HTTP errors, so every step is checked and a failed one stops the restore.
  const invalidateResourcesView = useInvalidateResourcesView();
  const restoreMutation = useMutation({
    mutationFn: () =>
      withQuietToasts(async () => {
        if (!targetResource) return;

        const progress = (content: string) => message.loading({ content, key: RESTORE_MESSAGE_KEY, duration: 0 });
        const checked = async <T,>(call: () => Promise<T>): Promise<T> => {
          const reply = await call();
          const error = replyError(reply);
          if (error) {
            throw new Error(error);
          }
          return reply;
        };
        const step = async (content: string, call: () => Promise<unknown>) => {
          progress(content);
          await checked(call);
        };

        progress(t('snapshot:restoring', 'Restoring snapshot...'));
        const definitions = await checked(() => getResourceDefinition({ resource_definitions: [targetResource] }));
        const definitionExists = !!definitions.data?.some(
          (rd) => rd.name?.toLowerCase() === targetResource.toLowerCase(),
        );

        let hasVolumeDefinitions = false;
        if (definitionExists) {
          // LINSTOR restores only into a definition that is not deployed. Checked
          // before any write: restoring the volume definitions first would add
          // volumes to the deployed resources and only then be refused.
          const deployed = await checked(() => getResourcesByResourceName(targetResource));
          if ((deployed.data?.length ?? 0) > 0) {
            throw new Error(
              t('snapshot:restore_target_deployed', {
                resource: targetResource,
                defaultValue:
                  '"{{resource}}" is deployed; a snapshot is restored only into a resource that is not deployed',
              }),
            );
          }
          const volumes = await checked(() => getVolumeDefinitionListByResource(targetResource));
          hasVolumeDefinitions = (volumes.data?.length ?? 0) > 0;
        } else {
          logger.debug('Creating new resource definition:', targetResource);
          await step(t('snapshot:creating_resource', 'Creating resource definition...'), () =>
            createResourceDefinition({ resource_definition: { name: targetResource } }),
          );
        }
        if (!hasVolumeDefinitions) {
          await step(t('snapshot:restoring_volume_definition', 'Restoring volume definition...'), () =>
            restoreVolumeDefinition(sourceResource, sourceSnapshot, { to_resource: targetResource }),
          );
        }
        await step(t('snapshot:restoring', 'Restoring snapshot...'), () =>
          restoreSnapshot(sourceResource, sourceSnapshot, { to_resource: targetResource }),
        );
      }),
    // Settled, not only succeeded: a restore that fails at its last step may
    // have deployed some of the target's resources already.
    onSettled: () => {
      invalidateResourcesView();
    },
    onSuccess: () => {
      message.success({ content: t('snapshot:restore_success', 'Restore succeeded'), key: RESTORE_MESSAGE_KEY });
      form.resetFields();
      setTargetInput('');
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      message.error({
        content: `${t('snapshot:restore_failed', 'Restore failed')}: ${error.message}`,
        key: RESTORE_MESSAGE_KEY,
        duration: 10,
      });
    },
  });

  return (
    <Form form={form} layout="vertical">
      <Form.Item label={t('snapshot:source_info', 'Source Information')} className="mb-2">
        <div>
          {t('snapshot:resource')}: {sourceResource}
        </div>
        <div>
          {t('snapshot:snapshot')}: {sourceSnapshot}
        </div>
      </Form.Item>

      <Form.Item label={t('snapshot:target_resource', 'Target Resource')} required>
        <AutoComplete
          className="w-full"
          placeholder={t('snapshot:select_target', 'Select target resource')}
          value={targetInput}
          onChange={setTargetInput}
          options={uniqBy(resourceList, 'name')?.map((r) => ({ label: r.name, value: r.name ?? '' }))}
          allowClear
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
        <div className="text-[12px] text-(--text-muted) mt-1">
          {t('snapshot:new_resource_tip', 'If you enter a new resource name, it will be created automatically')}
        </div>
      </Form.Item>

      <Form.Item className="mb-0 text-right">
        <Space>
          {onCancel && (
            <Button type="secondary" onClick={onCancel}>
              {t('common:cancel')}
            </Button>
          )}
          <Button
            type="primary"
            onClick={() => restoreMutation.mutate()}
            disabled={!targetResource || restoreMutation.isPending}
            loading={restoreMutation.isPending}
          >
            {t('snapshot:restore', 'Restore')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default RestoreFrom;
