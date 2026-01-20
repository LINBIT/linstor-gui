import {
  CaretRightOutlined,
  DeleteOutlined,
  HolderOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Form, Input, InputNumber, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import type { OcfAgentWithMetadata, ParamEntry, ResourceAgent } from '@/api/ha-profiles';

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
  currentTheme: string;
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
  currentTheme,
  onDelete,
  onExpand,
  expandedKeys,
  onRemoveParam,
  onAddParam,
  addedParams,
}: SortableItemProps) {
  // Get instanceId for stable key lookup
  // Fallback to array index if instanceId not set
  const stableKey = (agentWithMeta as any).instanceId ?? index;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.5 : 1,
  };

  const { item } = agentWithMeta;
  // Use instanceId for stable panel key across reorders
  const instanceId = (agentWithMeta as any).instanceId ?? index;
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
        label="Systemd Unit"
        initialValue={item.original}
        rules={[
          {
            required: true,
            message: 'Unit name is required',
          },
        ]}
      >
        <Input placeholder="e.g., var-lib-linstor.mount" />
      </Form.Item>
    );
  };

  // Render form field based on parameter type (for OCF agents)
  const renderFormField = (param: any) => {
    if (!ocfAgent) return null;

    const fieldName = [`agents`, index, `params`, param.name];
    const currentValue = getParamValue(ocfAgent.params, param.name);

    const label = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '13px', color: '#333' }}>{param.name}</span>
        {(param.longdesc || param.shortdesc) && (
          <Tooltip
            title={<div style={{ whiteSpace: 'pre-wrap', maxWidth: '400px' }}>{param.longdesc || param.shortdesc}</div>}
          >
            <QuestionCircleOutlined style={{ color: '#999', fontSize: '12px' }} />
          </Tooltip>
        )}
      </div>
    );

    switch (param.type) {
      case 'integer':
        return (
          <Form.Item
            key={param.name}
            name={fieldName}
            label={label}
            initialValue={currentValue}
            rules={[
              {
                required: param.required,
                message: `${param.name} is required`,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item
            key={param.name}
            name={fieldName}
            label={label}
            valuePropName="checked"
            getValueFrom={(value: boolean) => (value ? 'true' : 'false')}
            getValueProps={(value: string) => ({
              checked: value === 'true' || value === '1' || value === 'yes' || value === true,
            })}
            initialValue={typeof currentValue === 'boolean' ? (currentValue ? 'true' : 'false') : currentValue}
            rules={[
              {
                required: param.required,
                message: `${param.name} is required`,
              },
            ]}
          >
            <Switch />
          </Form.Item>
        );

      default:
        return (
          <Form.Item
            key={param.name}
            name={fieldName}
            label={label}
            initialValue={currentValue}
            rules={[
              {
                required: param.required,
                message: `${param.name} is required`,
              },
            ]}
          >
            <Input />
          </Form.Item>
        );
    }
  };

  // Get display info for the item
  const getItemDisplay = () => {
    if (isOcf && ocfAgent) {
      return {
        typeLabel: ocfAgent.agent_type,
        typeColor: 'purple' as const,
        instanceLabel: ocfAgent.instance_name,
        instanceColor: 'orange' as const,
      };
    } else {
      // Plain systemd unit
      const name = item.original.split(' ')[0]; // Take first part as name
      return {
        typeLabel: 'systemd',
        typeColor: 'blue' as const,
        instanceLabel: name,
        instanceColor: 'green' as const,
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
        style={{
          background: currentTheme === 'dark' ? '#1e293b' : '#f8fafc',
          marginBottom: '8px',
          borderRadius: '8px',
          border: `1px solid ${currentTheme === 'dark' ? '#334155' : '#e2e8f0'}`,
          cursor: 'grab',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header - always visible */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
          onClick={() => onExpand(panelKey)}
          {...attributes}
        >
          {/* Drag handle - only this element is draggable */}
          <div
            {...listeners}
            style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <HolderOutlined
              style={{
                color: '#999',
                fontSize: '16px',
              }}
            />
          </div>

          {/* Expand/Collapse icon */}
          <CaretRightOutlined
            style={{
              color: '#999',
              fontSize: '12px',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />

          {/* Item info */}
          <Space size="small" style={{ flex: 1 }}>
            <Tag color="blue">#{index + 1}</Tag>
            {isOcf && <Tag color="cyan">OCF</Tag>}
            <Tag color={displayInfo.typeColor}>{displayInfo.typeLabel}</Tag>
            {isOcf && ocfAgent && <Tag color={displayInfo.instanceColor}>{displayInfo.instanceLabel}</Tag>}
            {!isOcf && <Tag color={displayInfo.instanceColor}>{displayInfo.instanceLabel}</Tag>}
            {isOcf && isLoadingMetadata && <Tag color="processing">Loading metadata...</Tag>}
            {isOcf && !metadata && !isLoadingMetadata && <Tag color="warning">Metadata not found</Tag>}
          </Space>

          {/* Delete button */}
          <Popconfirm
            title="Delete this item?"
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(index);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </div>

        {/* Expanded content */}
        <div
          style={{
            padding: '16px',
            borderTop: `1px solid ${currentTheme === 'dark' ? '#334155' : '#e2e8f0'}`,
            display: isExpanded ? 'block' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Original string (for reference) */}
          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary">Original:</Text>
            <div
              style={{
                marginTop: '4px',
                padding: '8px',
                background: currentTheme === 'dark' ? '#0f172a' : '#f1f5f9',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                wordBreak: 'break-all',
              }}
            >
              {item.original}
            </div>
          </div>

          {/* Plain systemd unit - simple input */}
          {!isOcf && (
            <div>
              <Text strong>Systemd Unit Configuration</Text>
              {renderPlainUnitField()}
            </div>
          )}

          {/* OCF Agent with metadata */}
          {isOcf && metadata && (
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '14px' }}>
                {metadata.name}
              </Text>
              {metadata.shortdesc && (
                <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{metadata.shortdesc}</div>
              )}
            </div>
          )}

          {/* Form fields with metadata */}
          {isOcf && metadata && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <Text strong>Parameters</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={() => onAddParam?.(stableKey)}>
                  Add Parameter
                </Button>
              </div>

              {/* Only show parameters that exist in TOML or were added by user */}
              {(ocfAgent?.params || []).map((paramEntry) => {
                const param = metadata.parameters.find((p) => p.name === paramEntry.key);
                if (!param) return null;

                return (
                  <div key={paramEntry.key} style={{ position: 'relative', paddingRight: '40px' }}>
                    {renderFormField(param)}
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => onRemoveParam(stableKey, paramEntry.key)}
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: param.type === 'boolean' ? '0' : '32px',
                      }}
                    />
                  </div>
                );
              })}

              {/* Show manually added parameters */}
              {Array.from(addedParams.get(stableKey) || []).map((paramName) => {
                const param = metadata.parameters.find((p) => p.name === paramName);
                if (!param || hasParam(ocfAgent?.params, paramName)) return null;

                return (
                  <div key={paramName} style={{ position: 'relative', paddingRight: '40px' }}>
                    {renderFormField(param)}
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => onRemoveParam(stableKey, paramName)}
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: param.type === 'boolean' ? '0' : '32px',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* OCF Agent without metadata */}
          {isOcf && !metadata && ocfAgent && (
            <div>
              <Text strong>Parsed Parameters:</Text>
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: currentTheme === 'dark' ? '#0f172a' : '#f1f5f9',
                  borderRadius: '4px',
                }}
              >
                <pre style={{ margin: 0, fontSize: '12px' }}>{JSON.stringify(ocfAgent.params, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
