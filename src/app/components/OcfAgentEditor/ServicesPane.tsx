import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { FormInstance } from 'antd';
import { Card, Empty, Form, Space } from 'antd';
import { Button } from '@app/components/Button';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { SortableAgentItem } from './SortableAgentItem';
import type { AgentFormValue } from './agentForm';
import type { OcfAgentWithMetadata, ParsedOcfAgent, ResourceAgent, ResourceAgentsByProvider } from './types';

/** What antd's onValuesChange reports for the editor form. */
export interface EditorFormChange {
  resource_name?: string;
  // antd reports a changed list entry as a sparse array, or keyed by index.
  agents?: (AgentFormValue | undefined)[] | Record<string, AgentFormValue | undefined>;
}

interface ServicesPaneProps {
  form: FormInstance;
  mode: 'edit' | 'create';
  /** Resource definitions to pick from in create mode. */
  rdOptions: { label: string; value: string }[];
  rdLoading: boolean;
  parsedAgents: OcfAgentWithMetadata[];
  allAgents: ResourceAgentsByProvider;
  findAgentMetadata: (agent: ParsedOcfAgent) => ResourceAgent | null;
  currentTheme: string;
  expandedKeys: Set<string>;
  addedParams: Map<number, Set<string>>;
  onFinish: () => void;
  onValuesChange: (changedValues: EditorFormChange) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDelete: (index: number) => void;
  onExpand: (key: string) => void;
  onRemoveParam: (stableKey: number, paramName: string) => void;
  onAddParam: (stableKey: number) => void;
  onAddSystemd: () => void;
  onAddAgent: () => void;
}

/**
 * The services tab's editor: in create mode the resource and file name, then
 * the agents of the start array, sortable by drag and drop.
 */
export const ServicesPane = ({
  form,
  mode,
  rdOptions,
  rdLoading,
  parsedAgents,
  allAgents,
  findAgentMetadata,
  currentTheme,
  expandedKeys,
  addedParams,
  onFinish,
  onValuesChange,
  onDragEnd,
  onDelete,
  onExpand,
  onRemoveParam,
  onAddParam,
  onAddSystemd,
  onAddAgent,
}: ServicesPaneProps) => {
  const { t } = useTranslation();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Generate IDs for DnD - use instanceId for stable keys
  const items = useMemo(() => parsedAgents.map((agent) => `agent-${agent.instanceId}`), [parsedAgents]);

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button icon={<PlusOutlined />} onClick={onAddSystemd}>
              {t('common:add_systemd_mount')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddAgent}>
              {t('common:add_resource_agent')}
            </Button>
          </Space>
        </div>
      }
      variant="borderless"
      style={{ height: '100%', boxShadow: 'none' }}
      styles={{
        body: {
          padding: '16px',
          height: 'calc(100% - 57px)',
          overflow: 'auto',
        },
      }}
    >
      {/* Main Form */}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
        initialValues={{ agents: [] }}
        component={false}
      >
        {mode === 'create' && (
          <div style={{ padding: '0 12px 12px 12px' }}>
            <Form.Item
              name="resource_name"
              label={t('common:resource_name')}
              rules={[{ required: true, message: 'Please select resource' }]}
            >
              <Select
                placeholder={t('common:select_resource')}
                showSearch
                loading={rdLoading}
                options={rdOptions}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item
              name="file_path"
              label={t('common:config_file')}
              rules={[{ required: true, message: 'Please enter filename' }]}
            >
              <Input addonBefore="/etc/drbd-reactor.d/" addonAfter=".toml" placeholder="my-resource" />
            </Form.Item>
          </div>
        )}

        {/* OCF Agents List with Drag and Drop */}

        {parsedAgents.length === 0 ? (
          <Empty description={t('common:no_ocf_agents_found_in_start_array')} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {parsedAgents.map((agentWithMeta, index) => {
                const { item } = agentWithMeta;

                // Attempt to find metadata from allAgents (only for OCF agents)

                const matchedMetadata = item.is_ocf && item.ocf_agent ? findAgentMetadata(item.ocf_agent) : null;

                // If backend already returned metadata, use it; otherwise use matched one

                const metadata = agentWithMeta.metadata || matchedMetadata;

                const isLoadingMetadata = item.is_ocf && !metadata && !allAgents;

                // Use instanceId for stable ID

                const id = `agent-${agentWithMeta.instanceId}`;

                return (
                  <SortableAgentItem
                    key={id}
                    id={id}
                    index={index}
                    agentWithMeta={agentWithMeta}
                    metadata={metadata}
                    isLoadingMetadata={isLoadingMetadata}
                    currentTheme={currentTheme}
                    onDelete={onDelete}
                    onExpand={onExpand}
                    expandedKeys={expandedKeys}
                    onRemoveParam={onRemoveParam}
                    onAddParam={onAddParam}
                    addedParams={addedParams}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </Form>
    </Card>
  );
};
