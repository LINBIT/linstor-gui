import { useTranslation } from 'react-i18next';
import { Card, Spin, Typography } from 'antd';

const { Text } = Typography;

interface TomlPreviewProps {
  content: string;
  loading?: boolean;
  title?: string;
}

export function TomlPreview({ content, loading = false, title }: TomlPreviewProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 overflow-hidden min-w-0 flex flex-col h-full">
      <Card
        title={<Text strong>{title ?? t('common:live_preview_toml')}</Text>}
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
            {content}
          </div>
        </Spin>
      </Card>
    </div>
  );
}
