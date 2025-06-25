// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// RestoreFrom component: select target resource to restore snapshot to
import React, { useState } from 'react';
import { Button, Form, Select, message, Space } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { uniqBy } from 'lodash';
import { getResources } from '@app/features/resource/api';
import { createResourceDefinition } from '@app/features/resourceDefinition/api';
import { restoreSnapshot, restoreVolumeDefinition } from '../api';

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

  // Restore snapshot mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!targetResource) return;

      // Check if the target resource exists in the list
      const existingResource = resourceList?.data?.find((r: any) => r.name === targetResource);

      if (!existingResource) {
        // Create new resource definition if it doesn't exist
        console.log('Creating new resource definition:', targetResource);
        message.loading(t('snapshot:creating_resource', 'Creating resource definition...'), 0);

        try {
          await createResourceDefinition({
            resource_definition: {
              name: targetResource,
            },
          });
          message.destroy(); // Clear loading message
          message.success(t('snapshot:resource_created', 'Resource definition created successfully'));

          // Restore volume definition for the new resource
          message.loading(t('snapshot:restoring_volume_definition', 'Restoring volume definition...'), 0);
          await restoreVolumeDefinition(sourceResource, sourceSnapshot, { to_resource: targetResource });
          message.destroy(); // Clear loading message
          message.success(t('snapshot:volume_definition_restored', 'Volume definition restored successfully'));
        } catch (error) {
          message.destroy(); // Clear loading message
          message.error(t('snapshot:resource_creation_failed', 'Failed to create resource definition'));
          throw error; // Re-throw to stop the restore process
        }
      }

      // Restore snapshot to the target resource
      message.loading(t('snapshot:restoring', 'Restoring snapshot...'), 0);
      await restoreSnapshot(sourceResource, sourceSnapshot, { to_resource: targetResource });
      message.destroy(); // Clear loading message
    },
    onSuccess: () => {
      message.success(t('snapshot:restore_success', 'Restore succeeded'));
      form.resetFields();
      setTargetResource(undefined);
      if (onSuccess) onSuccess();
    },
    onError: () => {
      message.error(t('snapshot:restore_failed', 'Restore failed'));
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
          options={uniqBy(resourceList?.data, 'name')?.map((r: any) => ({ label: r.name, value: r.name }))}
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
          {onCancel && <Button onClick={onCancel}>{t('common:cancel')}</Button>}
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
