import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Switch, InputNumber, Card, Tooltip, Dropdown, MenuProps } from 'antd';
import { InfoCircleOutlined, PlusOutlined, MinusCircleOutlined, DownOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';

const { Option } = Select;

export interface DRBDReactorConfigValues {
  runner?: string;
  'dependencies-as'?: string;
  'target-as'?: string;
  'on-drbd-demote-failure'?: string;
  'secondary-force'?: boolean;
  'preferred-nodes'?: string[];
  'preferred-nodes-policy'?: string;
  'fencing-promote-delay'?: number;
  'on-quorum-loss'?: string;
  'stop-services-on-exit'?: boolean;
}

interface FieldDefinition {
  name: keyof DRBDReactorConfigValues;
  label: string;
  tooltip: string;
  type: 'select' | 'input' | 'switch' | 'number' | 'tags';
  options?: string[]; // For select type
  default?: any;
}

const ALL_FIELDS: FieldDefinition[] = [
  {
    name: 'runner',
    label: 'Runner',
    tooltip:
      "What should be used to execute services. 'systemd' is the default. 'shell' should only be used on non systemd/Windows systems.",
    type: 'select',
    options: ['systemd', 'shell'],
    default: 'systemd',
  },
  {
    name: 'dependencies-as',
    label: 'Dependencies As',
    tooltip: 'If the runner is systemd, generate inter service dependencies as this. Default: Requires',
    type: 'input',
  },
  {
    name: 'target-as',
    label: 'Target As',
    tooltip:
      'If the runner is systemd, generate service dependencies in the final target unit as this. Default: Requires',
    type: 'input',
  },
  {
    name: 'on-drbd-demote-failure',
    label: 'On DRBD Demote Failure',
    tooltip:
      "systemd OnFailure action that is executed on DRBD demote failures. If unset, or set to 'none', then no action is executed. Default: reboot",
    type: 'select',
    options: ['reboot', 'reboot-immediate', 'poweroff', 'poweroff-immediate', 'none'],
  },
  {
    name: 'secondary-force',
    label: 'Secondary Force',
    tooltip: "If set (the default), 'secondary --force' is used for demotion.",
    type: 'switch',
    default: true,
  },
  {
    name: 'stop-services-on-exit',
    label: 'Stop Services On Exit',
    tooltip:
      "If unset/empty, services from 'start' will be stopped in reverse order if the runner is 'shell'. If the runner is 'systemd', it always starts and stops the auto-generated implicit target unit.",
    type: 'switch',
  },
  {
    name: 'preferred-nodes',
    label: 'Preferred Nodes',
    tooltip: 'If set, resources are started on preferred nodes if possible. Node names need to match uname -n.',
    type: 'tags',
  },
  {
    name: 'preferred-nodes-policy',
    label: 'Preferred Nodes Policy',
    tooltip:
      "When to take preferred nodes into account. 'always' or 'start-only'. 'start-only': avoids jumping back to lower priority node if higher priority node joins later.",
    type: 'select',
    options: ['always', 'start-only'],
  },
  {
    name: 'fencing-promote-delay',
    label: 'Fencing Promote Delay',
    tooltip:
      "Wait this number of seconds before trying to promote if split-brain avoidance policy is 'fencing'. Ignored if policy is 'quorum'.",
    type: 'number',
  },
  {
    name: 'on-quorum-loss',
    label: 'On Quorum Loss',
    tooltip:
      "What to do if the current DRBD Primary node loses quorum. Default: shutdown. 'freeze' requires unified cgroups and supported services.",
    type: 'select',
    options: ['shutdown', 'freeze'],
  },
];

interface DRBDReactorConfigProps {
  initialValues: DRBDReactorConfigValues;
  onValuesChange: (values: DRBDReactorConfigValues) => void;
}

export const DRBDReactorConfig: React.FC<DRBDReactorConfigProps> = ({ initialValues, onValuesChange }) => {
  const [form] = Form.useForm();
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  // Initialize visible fields based on initialValues
  useEffect(() => {
    const keys = Object.keys(initialValues) as Array<keyof DRBDReactorConfigValues>;

    setVisibleFields((prev) => {
      const next = new Set(prev);
      // Add fields that have values from initialValues
      keys.forEach((key) => {
        if (initialValues[key] !== undefined && initialValues[key] !== null) {
          next.add(key);
        }
      });
      return next;
    });

    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const handleValuesChange = (_: any, allValues: DRBDReactorConfigValues) => {
    // Only pass values for visible fields
    const filteredValues: DRBDReactorConfigValues = {};
    ALL_FIELDS.forEach((field) => {
      if (visibleFields.has(field.name)) {
        // @ts-expect-error key access on partial type
        filteredValues[field.name] = allValues[field.name];
      }
    });
    onValuesChange(filteredValues);
  };

  const handleAddField = (fieldName: string) => {
    const field = ALL_FIELDS.find((f) => f.name === fieldName);
    if (field) {
      const newVisible = new Set(visibleFields);
      newVisible.add(fieldName);
      setVisibleFields(newVisible);

      // Set default value if available
      if (field.default !== undefined) {
        const currentValues = form.getFieldsValue();
        const newValues = { ...currentValues, [fieldName]: field.default };
        form.setFieldsValue(newValues);

        // Trigger update MANUALLY using NEW visible set
        // (handleValuesChange would use stale visibleFields from closure)
        const filteredValues: DRBDReactorConfigValues = {};
        ALL_FIELDS.forEach((f) => {
          if (newVisible.has(f.name)) {
            // @ts-expect-error key access on partial type
            filteredValues[f.name] = newValues[f.name];
          }
        });
        onValuesChange(filteredValues);
      }
    }
  };

  const handleRemoveField = (fieldName: string) => {
    const newVisible = new Set(visibleFields);
    newVisible.delete(fieldName);
    setVisibleFields(newVisible);

    const currentValues = form.getFieldsValue();
    // We don't delete from form state to avoid uncontrolled input warnings if accessed,
    // but we filter it out in handleValuesChange.
    // Actually better to set it to undefined in form.
    form.setFieldValue(fieldName, undefined);

    const newValues = { ...currentValues };
    delete newValues[fieldName as keyof DRBDReactorConfigValues];

    // Trigger update with filtered values
    // We need to re-filter based on the NEW visible set
    const filteredValues: DRBDReactorConfigValues = {};
    ALL_FIELDS.forEach((field) => {
      if (newVisible.has(field.name)) {
        // @ts-expect-error key access on partial type
        filteredValues[field.name] = newValues[field.name];
      }
    });
    onValuesChange(filteredValues);
  };

  const menuItems: MenuProps['items'] = ALL_FIELDS.filter((f) => !visibleFields.has(f.name)).map((f) => ({
    key: f.name,
    label: f.label,
    onClick: () => handleAddField(f.name),
  }));

  const renderFieldInput = (field: FieldDefinition) => {
    switch (field.type) {
      case 'select':
        return (
          <Select placeholder={`Select ${field.label}`}>
            {field.options?.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        );
      case 'switch':
        return <Switch />;
      case 'number':
        return <InputNumber style={{ width: '100%' }} />;
      case 'tags':
        return <Select mode="tags" placeholder="Enter values" tokenSeparators={[',']} />;
      case 'input':
      default:
        return <Input />;
    }
  };

  return (
    <Card bordered={false} bodyStyle={{ padding: '24px' }}>
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        {ALL_FIELDS.map((field) => {
          if (!visibleFields.has(field.name)) return null;

          return (
            <div key={field.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <Form.Item
                  name={field.name}
                  valuePropName={field.type === 'switch' ? 'checked' : 'value'}
                  label={<SpaceWithTooltip label={field.label} tooltip={field.tooltip} />}
                >
                  {renderFieldInput(field)}
                </Form.Item>
              </div>
              <Button
                type="text"
                icon={<MinusCircleOutlined />}
                onClick={() => handleRemoveField(field.name)}
                style={{ marginTop: '30px', color: '#ff4d4f' }}
                title="Remove field"
              />
            </div>
          );
        })}

        <div style={{ marginTop: '16px' }}>
          <Dropdown menu={{ items: menuItems }} disabled={menuItems.length === 0} trigger={['click']}>
            <Button type="dashed" block icon={<PlusOutlined />}>
              Add Configuration <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </Form>
    </Card>
  );
};

const SpaceWithTooltip = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <span>
    {label}
    <Tooltip title={tooltip}>
      <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
    </Tooltip>
  </span>
);
