// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Alert, Button as AntButton, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { SERVICE_KEYS, ServiceKey, getServicePreset } from '../presets';

type PropRow = { id: string; key: string; value: string };

// What the wizard collects from this step and posts at the final create step.
export type ResourceGroupPlan = {
  name: string;
  select_filter: { place_count?: number };
  props: Record<string, string>;
};

export type ResourceGroupStepHandle = {
  // Validates the form and returns the planned resource group. Throws the
  // rc-field-form rejection on validation failure. No API call here — the
  // wizard sends the request at the final step.
  validateAndGet: () => Promise<ResourceGroupPlan>;
};

export interface ResourceGroupStepProps {
  nodeCount: number;
}

let rowSeq = 0;
const newRow = (key = '', value = ''): PropRow => ({ id: `p${rowSeq++}`, key, value });

export const ResourceGroupStep = forwardRef<ResourceGroupStepHandle, ResourceGroupStepProps>(({ nodeCount }, ref) => {
  const { t } = useTranslation(['clusterSetup', 'common']);
  const [form] = Form.useForm<{ name?: string; place_count?: number }>();
  const [service, setService] = useState<ServiceKey | undefined>(undefined);
  const [rows, setRows] = useState<PropRow[]>([]);

  const applyService = (key: ServiceKey) => {
    const preset = getServicePreset(key);
    setService(key);
    setRows(preset.props.map((p) => newRow(p.key, p.value)));
    if (!form.getFieldValue('name')) {
      form.setFieldsValue({ name: preset.nameSuggestion });
    }
  };

  const updateRow = (id: string, patch: Partial<Pick<PropRow, 'key' | 'value'>>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  useImperativeHandle(
    ref,
    () => ({
      validateAndGet: async () => {
        const values = await form.validateFields();
        const props: Record<string, string> = {};
        for (const row of rows) {
          const key = row.key.trim();
          const value = row.value.trim();
          if (key) props[key] = value;
        }
        return {
          name: (values.name ?? '').trim(),
          select_filter: typeof values.place_count === 'number' ? { place_count: values.place_count } : {},
          props,
        };
      },
    }),
    [form, rows],
  );

  return (
    <Form form={form} layout="vertical" initialValues={{ place_count: 2 }}>
      <Alert type="info" showIcon message={t('clusterSetup:rg_hint')} style={{ marginBottom: 16 }} />

      <Form.Item
        name="name"
        label={t('clusterSetup:rg_name')}
        rules={[{ required: true, message: t('clusterSetup:required') }]}
      >
        <Input placeholder="vm-data" />
      </Form.Item>

      <Form.Item name="place_count" label={t('clusterSetup:place_count')}>
        <InputNumber min={1} max={32} style={{ width: 160 }} />
      </Form.Item>

      <Form.Item label={t('clusterSetup:service_label')} extra={t('clusterSetup:service_hint')}>
        <Select
          value={service}
          onChange={(value) => applyService(value as ServiceKey)}
          placeholder={t('clusterSetup:service_placeholder')}
          style={{ width: 240 }}
          options={SERVICE_KEYS.map((k) => ({ label: t(`clusterSetup:service_${k}`), value: k }))}
        />
      </Form.Item>

      {service === 'ha' && nodeCount < 3 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('clusterSetup:ha_needs_three_nodes', { count: nodeCount })}
        />
      )}

      <Typography.Text strong style={{ display: 'block', margin: '4px 0 12px' }}>
        {t('clusterSetup:properties_header')}
      </Typography.Text>

      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {rows.map((row) => (
          <Space key={row.id} align="baseline" style={{ display: 'flex', width: '100%' }}>
            <Input
              placeholder={t('clusterSetup:property_key')}
              value={row.key}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
              style={{ width: 360 }}
            />
            <Input
              placeholder={t('clusterSetup:property_value')}
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              style={{ width: 220 }}
            />
            <AntButton
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(row.id)}
              aria-label={t('common:delete')}
            />
          </Space>
        ))}
        <AntButton type="dashed" icon={<PlusOutlined />} onClick={addRow} style={{ width: 600 }}>
          {t('clusterSetup:add_property')}
        </AntButton>
      </Space>
    </Form>
  );
});
ResourceGroupStep.displayName = 'ResourceGroupStep';
