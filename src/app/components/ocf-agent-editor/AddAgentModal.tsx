import { Form, Modal, Select } from 'antd';

interface ResourceAgentsByProvider {
  providers: Record<
    string,
    Array<{
      name: string;
      shortdesc?: string;
      longdesc?: string;
    }>
  >;
}

interface AddAgentModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  allAgents: ResourceAgentsByProvider | null;
}

export function AddAgentModal({
  visible,
  onOk,
  onCancel,
  selectedProvider,
  onProviderChange,
  selectedAgent,
  onAgentChange,
  allAgents,
}: AddAgentModalProps) {
  return (
    <Modal
      title="Add OCF Agent"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
      okText="Add"
      cancelText="Cancel"
    >
      <Form layout="vertical" style={{ marginTop: '16px' }}>
        <Form.Item label="Provider">
          <Select
            placeholder="Select provider"
            value={selectedProvider || undefined}
            onChange={onProviderChange}
            options={
              allAgents
                ? Object.keys(allAgents.providers)
                    .sort()
                    .map((p) => ({
                      label: p,
                      value: p,
                    }))
                : []
            }
          />
        </Form.Item>

        <Form.Item label="Agent">
          <Select
            placeholder="Select agent"
            value={selectedAgent || undefined}
            onChange={onAgentChange}
            disabled={!selectedProvider}
            options={
              selectedProvider && allAgents
                ? allAgents.providers[selectedProvider]?.map((a) => ({
                    label: `${a.name} - ${a.shortdesc || ''}`,
                    value: a.name,
                  }))
                : []
            }
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        {selectedAgent && selectedProvider && allAgents && (
          <Form.Item label="Description">
            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              {allAgents.providers[selectedProvider]?.find((a) => a.name === selectedAgent)?.longdesc ||
                'No description available'}
            </div>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
