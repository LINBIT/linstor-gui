import { Card, Spin, Typography } from 'antd';
import type { OcfAgentWithMetadata, ParamEntry, ParsedOcfAgent } from '@/api/ha-profiles';

const { Text } = Typography;

// Helper function to generate OCF string from agent data
function generateOcfString(agent: ParsedOcfAgent, params?: ParamEntry[]): string {
  const { provider, agent_type, instance_name } = agent;
  const finalParams = params || agent.params;

  // Build key=value pairs - order is preserved from the array
  const paramStr = finalParams
    .map(({ key, value }) => {
      if (value === undefined || value === null) return '';
      // Quote values if they contain spaces or special characters
      if (String(value).includes(' ') || String(value).includes(',') || String(value) === '') {
        return `${key}='${value}'`;
      }
      return `${key}=${value}`;
    })
    .filter(Boolean)
    .join(' ');

  return `ocf:${provider}:${agent_type} ${instance_name}${paramStr ? ` ${paramStr}` : ''}`;
}

interface AgentPreviewProps {
  parsedAgents: OcfAgentWithMetadata[];
  loading: boolean;
  currentTheme: string;
}

export function AgentPreview({ parsedAgents, loading, currentTheme }: AgentPreviewProps) {
  // Generate OCF string from agent data
  const generateAgentString = (itemWithMeta: OcfAgentWithMetadata): string => {
    if (itemWithMeta.item.is_ocf && itemWithMeta.item.ocf_agent) {
      // OCF agent - use generateOcfString
      const agent = itemWithMeta.item.ocf_agent;
      const params = agent.params || [];
      const result = generateOcfString(agent, params);
      return `    "${result}"`;
    } else {
      // Plain systemd unit - use item.original directly
      return `    "${itemWithMeta.item.original}"`;
    }
  };

  // Generate full TOML start array preview
  const generateTomlPreview = (): string => {
    const agentStrings = parsedAgents.map((agentWithMeta) => {
      return generateAgentString(agentWithMeta);
    });

    return `start = [\n${agentStrings.join(',\n')}\n  ]`;
  };

  return (
    <div
      style={{
        flex: 0.6,
        overflow: 'hidden',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card
        title={<Text strong>Live Preview (TOML)</Text>}
        bordered={false}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
        }}
        bodyStyle={{
          padding: '16px',
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Spin spinning={loading} tip="Generating preview...">
          <div
            style={{
              background: currentTheme === 'dark' ? '#0f172a' : '#f1f5f9',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: `1px solid ${currentTheme === 'dark' ? '#334155' : '#e2e8f0'}`,
              overflow: 'auto',
              flex: 1,
              maxHeight: '100%',
            }}
          >
            {generateTomlPreview()}
          </div>
        </Spin>
      </Card>
    </div>
  );
}
