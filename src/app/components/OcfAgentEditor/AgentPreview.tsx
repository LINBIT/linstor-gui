import { useTranslation } from 'react-i18next';
import { Card, Spin, Typography } from 'antd';
import type { OcfAgentWithMetadata, ParamEntry, ParsedOcfAgent } from './types';

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
}

export function AgentPreview({ parsedAgents, loading }: AgentPreviewProps) {
  const { t } = useTranslation();
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
    <div className="flex-[0.6] overflow-hidden min-w-0 flex flex-col">
      <Card
        title={<Text strong>{t('common:live_preview_toml')}</Text>}
        variant="borderless"
        className="h-full flex flex-col shadow-none"
        styles={{
          body: {
            padding: '16px',
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Spin spinning={loading} description={t('common:generating_preview')}>
          <div className="ocf-preview-code bg-(--bg-surface) rounded-lg p-4 font-[monospace] text-[13px] whitespace-pre-wrap [word-break:break-word] border border-(--border-default) overflow-auto flex-1 max-h-full">
            {generateTomlPreview()}
          </div>
        </Spin>
      </Card>
    </div>
  );
}
