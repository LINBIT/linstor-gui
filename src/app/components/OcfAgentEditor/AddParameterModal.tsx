import { Form, Modal, Select, Tag, Typography } from 'antd';
import { Button } from '@app/components/Button';

const { Text } = Typography;

interface Parameter {
  name: string;
  unique: boolean;
  required: boolean;
  shortdesc?: string;
  longdesc?: string;
  type: string;
  default?: string;
}

interface ResourceAgent {
  name: string;
  version?: string;
  shortdesc?: string;
  longdesc?: string;
  parameters: Parameter[];
}

interface ResourceAgentsByProvider {
  providers: Record<string, ResourceAgent[]>;
}

interface OcfAgentWithMetadata {
  position: {
    section: string;
    array_index: number | null;
    key: string;
    index: number;
  };
  item: {
    original: string;
    is_ocf: boolean;
    ocf_agent: {
      original: string;
      provider: string;
      agent_type: string;
      instance_name: string;
      params: Array<{ key: string; value: string }>;
    } | null;
  };
  metadata: ResourceAgent | null;
  instanceId: number;
}

interface AddParameterModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentAgentIndex: number | null;
  selectedParam: string;
  onParamChange: (param: string) => void;
  parsedAgents: OcfAgentWithMetadata[];
  allAgents: ResourceAgentsByProvider;
}

export function AddParameterModal({
  visible,
  onOk,
  onCancel,
  currentAgentIndex,
  selectedParam,
  onParamChange,
  parsedAgents,
  allAgents,
}: AddParameterModalProps) {
  const agent = currentAgentIndex !== null ? parsedAgents.find((a) => a.instanceId === currentAgentIndex) : null;

  // Find metadata: use attached metadata or look it up in allAgents
  const metadata =
    agent?.metadata ||
    (agent?.item.ocf_agent
      ? allAgents.providers[agent.item.ocf_agent.provider]?.find((a) => a.name === agent.item.ocf_agent!.agent_type)
      : null);

  // Get available parameters
  const availableParams = metadata
    ? metadata.parameters
        .filter((p) => {
          const existingParams = new Set((agent?.item.ocf_agent?.params || []).map((param) => param.key));
          return !existingParams.has(p.name);
        })
        .map((p) => ({
          label: `${p.name}${p.required ? ' (required)' : ''} - ${p.shortdesc || p.type}`,
          value: p.name,
        }))
    : [];

  // Get selected param details
  const selectedParamMeta = metadata?.parameters.find((p) => p.name === selectedParam);

  return (
    <Modal
      title="Add Parameter"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="ok" type="primary" onClick={onOk} disabled={!selectedParam}>
          Add
        </Button>,
      ]}
    >
      <Form layout="vertical" style={{ marginTop: '16px' }}>
        <Form.Item label="Parameter">
          <Select
            placeholder="Select parameter to add"
            value={selectedParam || undefined}
            onChange={onParamChange}
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={availableParams}
            disabled={!agent || !metadata}
          />
        </Form.Item>

        {selectedParam && selectedParamMeta && (
          <>
            <Form.Item label="Type">
              <Tag color="blue">{selectedParamMeta.type}</Tag>
            </Form.Item>

            <Form.Item label="Description">
              <div
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                {selectedParamMeta.longdesc || selectedParamMeta.shortdesc || 'No description available'}
              </div>
            </Form.Item>

            <Form.Item label="Default Value">
              <Text code>{selectedParamMeta.default || '(empty)'}</Text>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
