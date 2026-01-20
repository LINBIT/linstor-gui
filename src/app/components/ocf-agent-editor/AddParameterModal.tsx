import { Form, Modal, Select, Tag, Typography } from 'antd';

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
  metadata: {
    name: string;
    version?: string;
    shortdesc?: string;
    longdesc?: string;
    parameters: Parameter[];
  } | null;
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
}

export function AddParameterModal({
  visible,
  onOk,
  onCancel,
  currentAgentIndex,
  selectedParam,
  onParamChange,
  parsedAgents,
}: AddParameterModalProps) {
  const agent = currentAgentIndex !== null ? parsedAgents[currentAgentIndex] : null;

  // Get available parameters
  const availableParams = agent?.metadata
    ? agent.metadata.parameters
        .filter((p) => {
          const existingParams = new Set((agent.item.ocf_agent?.params || []).map((param) => param.key));
          return !existingParams.has(p.name);
        })
        .map((p) => ({
          label: `${p.name}${p.required ? ' (required)' : ''} - ${p.shortdesc || p.type}`,
          value: p.name,
        }))
    : [];

  // Get selected param details
  const selectedParamMeta = agent?.metadata?.parameters.find((p) => p.name === selectedParam);

  return (
    <Modal
      title="Add Parameter"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
      okText="Add"
      cancelText="Cancel"
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
            disabled={!agent}
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
