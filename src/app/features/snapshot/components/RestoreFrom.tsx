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
import { restoreSnapshot } from '../api';

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

  // Restore snapshot mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!targetResource) return;
      await restoreSnapshot(sourceResource, sourceSnapshot, { to_resource: targetResource });
    },
    onSuccess: () => {
      message.success(t('snapshot:restore_success', 'Restore succeeded'));
      form.resetFields();
      setTargetResource(undefined);
      if (onSuccess) onSuccess();
    },
    onError: (e: any) => {
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
          onChange={setTargetResource}
          options={uniqBy(resourceList?.data, 'name')?.map((r: any) => ({ label: r.name, value: r.name }))}
          allowClear
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
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
