// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// RestoreFrom component: select target resource to restore snapshot to
import React, { useState } from 'react';
import { logger } from '@app/utils/logger';
import { Form, message, Space } from 'antd';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { uniqBy } from 'lodash';
import { getResources } from '@app/features/resource/api';
import { createResourceDefinition } from '@app/features/resourceDefinition/api';
import { restoreSnapshot, restoreVolumeDefinition } from '../api';
import { withQuietToasts } from '@app/utils/toast';
import { deleteError as replyError } from '@app/hooks/useDeleteAction';

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
  const [targetResource, setTargetResource] = useState<string | undefined>();

  // Fetch resource list for target dropdown
  const { data: resourceList, isLoading: resourceLoading } = useQuery(['getResources'], () => getResources());

  // Handle target resource change
  const handleTargetResourceChange = (value: string | string[]) => {
    // For tags mode, value could be an array, but we only want the first/last value
    const resourceName = Array.isArray(value) ? value[value.length - 1] : value;
    setTargetResource(resourceName);
  };

  // Restore snapshot mutation. Up to three requests make one restore: their
  // replies are kept quiet and one progress message (same key) walks through
  // the steps and ends as the outcome. openapi-fetch resolves on HTTP errors,
  // so every step is checked and a failed one stops the restore.
  const restoreMutation = useMutation({
    mutationFn: () =>
      withQuietToasts(async () => {
        if (!targetResource) return;

        const step = async (progress: string, call: () => Promise<unknown>) => {
          message.loading({ content: progress, key: RESTORE_MESSAGE_KEY, duration: 0 });
          const error = replyError(await call());
          if (error) {
            throw new Error(error);
          }
        };

        const existingResource = resourceList?.data?.find((r) => r.name === targetResource);
        if (!existingResource) {
          logger.debug('Creating new resource definition:', targetResource);
          await step(t('snapshot:creating_resource', 'Creating resource definition...'), () =>
            createResourceDefinition({ resource_definition: { name: targetResource } }),
          );
          await step(t('snapshot:restoring_volume_definition', 'Restoring volume definition...'), () =>
            restoreVolumeDefinition(sourceResource, sourceSnapshot, { to_resource: targetResource }),
          );
        }
        await step(t('snapshot:restoring', 'Restoring snapshot...'), () =>
          restoreSnapshot(sourceResource, sourceSnapshot, { to_resource: targetResource }),
        );
      }),
    onSuccess: () => {
      message.success({ content: t('snapshot:restore_success', 'Restore succeeded'), key: RESTORE_MESSAGE_KEY });
      form.resetFields();
      setTargetResource(undefined);
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
      <Form.Item label={t('snapshot:source_info', 'Source Information')} style={{ marginBottom: '8px' }}>
        <div>
          {t('snapshot:resource')}: {sourceResource}
        </div>
        <div>
          {t('snapshot:snapshot')}: {sourceSnapshot}
        </div>
      </Form.Item>

      <Form.Item label={t('snapshot:target_resource', 'Target Resource')} required>
        <Select
          style={{ width: '100%' }}
          loading={resourceLoading}
          placeholder={t('snapshot:select_target', 'Select target resource')}
          value={targetResource}
          onChange={handleTargetResourceChange}
          options={uniqBy(resourceList?.data, 'name')?.map((r) => ({ label: r.name, value: r.name }))}
          allowClear
          showSearch
          mode="tags"
          maxTagCount={1}
          optionFilterProp="label"
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          notFoundContent={null}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {t('snapshot:new_resource_tip', 'If you enter a new resource name, it will be created automatically')}
        </div>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          {onCancel && (
            <Button type="secondary" onClick={onCancel}>
              {t('common:cancel')}
            </Button>
          )}
          <Button
            type="primary"
            onClick={() => restoreMutation.mutate()}
            disabled={!targetResource || restoreMutation.isLoading}
            loading={restoreMutation.isLoading}
          >
            {t('snapshot:restore', 'Restore')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default RestoreFrom;
