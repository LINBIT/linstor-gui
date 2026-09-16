import { Form, Modal, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';

const { Text } = Typography;

import type { OcfAgentWithMetadata, ResourceAgentsByProvider } from './types';

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
  const { t } = useTranslation();
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
      title={t('common:add_parameter')}
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
        <Form.Item label={t('common:parameter')}>
          <Select
            placeholder={t('common:select_parameter_add')}
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
            <Form.Item label={t('clusterSetup:node_type')}>
              <Tag color="blue">{selectedParamMeta.type}</Tag>
            </Form.Item>

            <Form.Item label={t('authToken:description')}>
              <div
                style={{
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                {selectedParamMeta.longdesc || selectedParamMeta.shortdesc || 'No description available'}
              </div>
            </Form.Item>

            <Form.Item label={t('common:default_value')}>
              <Text code>{selectedParamMeta.default || '(empty)'}</Text>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
