// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { forwardRef, useImperativeHandle, useState } from 'react';
import { Alert, Form, Space, Typography } from 'antd';
import { Input } from '@app/components/Input';
import { InputNumber } from '@app/components/InputNumber';
import { Select } from '@app/components/Select';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { SERVICE_KEYS, ServiceKey, getServicePreset } from '../presets';
import { Button } from '@app/components/Button';

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
      <Alert type="info" showIcon title={t('clusterSetup:rg_hint')} className="mb-4" />

      <Form.Item
        name="name"
        label={t('clusterSetup:rg_name')}
        rules={[{ required: true, message: t('clusterSetup:required') }]}
      >
        <Input placeholder="vm-data" />
      </Form.Item>

      <Form.Item name="place_count" label={t('clusterSetup:place_count')}>
        <InputNumber min={1} max={32} className="w-[160px]" />
      </Form.Item>

      {/* Not a form field (it only pre-fills the properties), so the label is tied to the select by hand. */}
      <Form.Item
        label={t('clusterSetup:service_label')}
        htmlFor="cluster-setup-rg-service"
        extra={t('clusterSetup:service_hint')}
      >
        <Select
          id="cluster-setup-rg-service"
          value={service}
          onChange={(value) => applyService(value as ServiceKey)}
          placeholder={t('clusterSetup:service_placeholder')}
          className="w-[240px]"
          options={SERVICE_KEYS.map((k) => ({ label: t(`clusterSetup:service_${k}`), value: k }))}
        />
      </Form.Item>

      {service === 'ha' && nodeCount < 3 && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          title={t('clusterSetup:ha_needs_three_nodes', { count: nodeCount })}
        />
      )}

      <Typography.Text strong className="block mt-1 mb-3">
        {t('clusterSetup:properties_header')}
      </Typography.Text>

      <Space orientation="vertical" size={8} className="w-full">
        {rows.map((row) => (
          <Space key={row.id} align="baseline" className="flex w-full">
            <Input
              placeholder={t('clusterSetup:property_key')}
              value={row.key}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
              className="w-[360px]"
            />
            <Input
              placeholder={t('clusterSetup:property_value')}
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              className="w-[220px]"
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(row.id)}
              aria-label={t('common:delete')}
            />
          </Space>
        ))}
        <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} className="w-[600px]">
          {t('clusterSetup:add_property')}
        </Button>
      </Space>
    </Form>
  );
});
ResourceGroupStep.displayName = 'ResourceGroupStep';
