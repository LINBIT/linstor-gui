import {
  CaretRightOutlined,
  DeleteOutlined,
  HolderOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { CSS } from '@dnd-kit/utilities';
import { Card, Form, Space, Tooltip, Typography } from 'antd';
import { Tag } from '@app/components/Tag';
import { Input } from '@app/components/Input';
import { InputNumber } from '@app/components/InputNumber';
import type { OcfAgentWithMetadata, Parameter, ParamEntry, ResourceAgent } from './types';
import { Button } from '@app/components/Button';
import { Popconfirm } from '@app/components/Popconfirm';
import { Switch } from '@app/components/Switch';

const { Text } = Typography;

// Helper to get param value from ParamEntry[]
function getParamValue(params: ParamEntry[] | undefined, key: string): string | undefined {
  return params?.find((p) => p.key === key)?.value;
}

// Helper to check if param exists
function hasParam(params: ParamEntry[] | undefined, key: string): boolean {
  return params?.some((p) => p.key === key) || false;
}

export interface SortableItemProps {
  id: string;
  index: number;
  agentWithMeta: OcfAgentWithMetadata;
  metadata: ResourceAgent | null;
  isLoadingMetadata: boolean;
  onDelete: (index: number) => void;
  onExpand: (key: string) => void;
  expandedKeys: Set<string>;
  onRemoveParam: (index: number, paramName: string) => void;
  onAddParam: (index: number) => void;
  addedParams: Map<number, Set<string>>;
}

export function SortableAgentItem({
  id,
  index,
  agentWithMeta,
  metadata,
  isLoadingMetadata,
  onDelete,
  onExpand,
  expandedKeys,
  onRemoveParam,
  onAddParam,
  addedParams,
}: SortableItemProps) {
  const { t } = useTranslation();
  // Get instanceId for stable key lookup
  // Fallback to array index if instanceId not set
  const stableKey = agentWithMeta.instanceId ?? index;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.5 : 1,
  };

  const { item } = agentWithMeta;
  // Use instanceId for stable panel key across reorders
  const instanceId = agentWithMeta.instanceId ?? index;
  const panelKey = `agent-${instanceId}`;
  const isExpanded = expandedKeys.has(panelKey);

  // Determine if this is an OCF agent or plain systemd unit
  const isOcf = item.is_ocf;
  const ocfAgent = item.ocf_agent;

  // Render form field for plain systemd unit
  const renderPlainUnitField = () => {
    const fieldName = ['agents', index, 'original'];

    return (
      <Form.Item
        name={fieldName}
        label={t('common:systemd_unit')}
        initialValue={item.original}
        rules={[
          {
            required: true,
            message: t('common:unit_name_required'),
          },
        ]}
      >
        <Input placeholder="e.g., var-lib-linstor.mount" />
      </Form.Item>
    );
  };

  const renderParamLabel = (param: Parameter) => (
    <div className="flex items-center gap-1">
      <span className="text-[13px] text-(--text-secondary)">{param.name}</span>
      {(param.longdesc || param.shortdesc) && (
        <Tooltip title={<div className="whitespace-pre-wrap max-w-[400px]">{param.longdesc || param.shortdesc}</div>}>
          <QuestionCircleOutlined className="text-(--icon-muted) text-[12px]" />
        </Tooltip>
      )}
    </div>
  );

  // The parameter name above the control is a plain text label, so it names the control here.
  const renderParamControl = (param: Parameter) => {
    switch (param.type) {
      case 'integer':
        return <InputNumber className="w-full" aria-label={param.name} />;
      case 'boolean':
        return <Switch aria-label={param.name} />;
      default:
        return <Input aria-label={param.name} />;
    }
  };

  // Get display info for the item
  const getItemDisplay = () => {
    if (isOcf && ocfAgent) {
      return {
        typeLabel: ocfAgent.agent_type,
        instanceLabel: ocfAgent.instance_name,
      };
    } else {
      // Plain systemd unit
      const name = item.original.split(' ')[0]; // Take first part as name
      return {
        typeLabel: 'systemd',
        instanceLabel: name,
      };
    }
  };

  const displayInfo = getItemDisplay();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-agent-item ${isDragging ? 'sortable-agent-item--dragging' : ''}`}
    >
      <Card
        size="small"
        className="bg-(--bg-surface) mb-2 rounded-lg border border-(--border-default) cursor-grab"
        styles={{ body: { padding: 0 } }}
      >
        {/* Header - always visible */}
        <div
          className="py-3 px-4 flex items-center gap-3 cursor-pointer"
          onClick={() => onExpand(panelKey)}
          {...attributes}
        >
          {/* Drag handle - only this element is draggable */}
          <div {...listeners} className="cursor-grab flex items-center" onClick={(e) => e.stopPropagation()}>
            <HolderOutlined className="text-(--icon-muted) text-[16px]" />
          </div>

          {/* Expand/Collapse icon */}
          <CaretRightOutlined
            className="text-(--icon-muted) text-[12px]"
            style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />

          {/* Item info */}
          <Space size="small" className="flex-1">
            <Tag>#{index + 1}</Tag>
            {isOcf && <Tag tone="info">OCF</Tag>}
            <Tag tone="info">{displayInfo.typeLabel}</Tag>
            {isOcf && ocfAgent && <Tag>{displayInfo.instanceLabel}</Tag>}
            {!isOcf && <Tag>{displayInfo.instanceLabel}</Tag>}
            {isOcf && isLoadingMetadata && <Tag tone="info">{t('common:loading_metadata')}</Tag>}
            {isOcf && !metadata && !isLoadingMetadata && <Tag tone="warning">{t('common:metadata_not_found')}</Tag>}
          </Space>

          {/* Delete button */}
          <Popconfirm
            title={t('common:delete_item')}
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(index);
            }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </div>

        {/* Expanded content */}
        <div
          className="p-4 border-t border-t-(--border-subtle)"
          style={{ display: isExpanded ? 'block' : 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Original string (for reference) */}
          <div className="mb-4">
            <div className="mt-1 p-2 bg-(--bg-page) rounded font-[monospace] text-[12px] break-all">
              {item.original}
            </div>
          </div>

          {/* Plain systemd unit - simple input */}
          {!isOcf && (
            <div>
              <Text strong>{t('common:systemd_unit_configuration')}</Text>
              {renderPlainUnitField()}
            </div>
          )}

          {/* OCF Agent with metadata */}
          {isOcf && metadata && (
            <div className="mb-4">
              <Text strong className="text-[14px]">
                {metadata.name}
              </Text>
              {metadata.shortdesc && <div className="text-(--text-muted) text-[12px] mt-1">{metadata.shortdesc}</div>}
            </div>
          )}

          {/* Form fields with metadata */}
          {isOcf && metadata && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <Text strong>{t('common:parameters')}</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={() => onAddParam?.(stableKey)}>
                  {t('common:add_parameter')}
                </Button>
              </div>

              {/* Only show parameters that exist in TOML or were added by user */}
              {(ocfAgent?.params || []).map((paramEntry) => {
                const param = metadata.parameters.find((p) => p.name === paramEntry.key);
                if (!param) return null;

                const fieldName = ['agents', index, 'params', param.name];
                const currentValue = getParamValue(ocfAgent?.params, param.name);
                const initialValue =
                  param.type === 'boolean' && typeof currentValue === 'boolean'
                    ? currentValue
                      ? 'true'
                      : 'false'
                    : currentValue;

                return (
                  <div key={paramEntry.key} className="mb-3">
                    {renderParamLabel(param)}
                    <div className="flex items-center gap-2 mt-1">
                      <Form.Item
                        key={param.name}
                        name={fieldName}
                        initialValue={initialValue}
                        rules={[
                          {
                            required: param.required,
                            message: t('common:param_is_required', { name: param.name }),
                          },
                        ]}
                        valuePropName={param.type === 'boolean' ? 'checked' : undefined}
                        normalize={
                          param.type === 'boolean' ? (value: boolean) => (value ? 'true' : 'false') : undefined
                        }
                        getValueProps={
                          param.type === 'boolean'
                            ? (value: string | boolean) => ({
                                checked: value === 'true' || value === '1' || value === 'yes' || value === true,
                              })
                            : undefined
                        }
                        className="flex-1 mb-0"
                      >
                        {renderParamControl(param)}
                      </Form.Item>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => onRemoveParam(stableKey, paramEntry.key)}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Show manually added parameters */}
              {Array.from(addedParams.get(stableKey) || []).map((paramName) => {
                const param = metadata.parameters.find((p) => p.name === paramName);
                if (!param || hasParam(ocfAgent?.params, paramName)) return null;

                const fieldName = ['agents', index, 'params', param.name];
                const currentValue = getParamValue(ocfAgent?.params, param.name);
                const initialValue =
                  param.type === 'boolean' && typeof currentValue === 'boolean'
                    ? currentValue
                      ? 'true'
                      : 'false'
                    : currentValue;

                return (
                  <div key={paramName} className="mb-3">
                    {renderParamLabel(param)}
                    <div className="flex items-center gap-2 mt-1">
                      <Form.Item
                        key={param.name}
                        name={fieldName}
                        initialValue={initialValue}
                        rules={[
                          {
                            required: param.required,
                            message: t('common:param_is_required', { name: param.name }),
                          },
                        ]}
                        valuePropName={param.type === 'boolean' ? 'checked' : undefined}
                        normalize={
                          param.type === 'boolean' ? (value: boolean) => (value ? 'true' : 'false') : undefined
                        }
                        getValueProps={
                          param.type === 'boolean'
                            ? (value: string | boolean) => ({
                                checked: value === 'true' || value === '1' || value === 'yes' || value === true,
                              })
                            : undefined
                        }
                        className="flex-1 mb-0"
                      >
                        {renderParamControl(param)}
                      </Form.Item>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => onRemoveParam(stableKey, paramName)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* OCF Agent without metadata */}
          {isOcf && !metadata && ocfAgent && (
            <div>
              <Text strong>{t('common:parsed_parameters')}</Text>
              <div className="mt-2 p-3 bg-(--bg-page) rounded">
                <pre className="m-0 text-[12px]">{JSON.stringify(ocfAgent.params, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
