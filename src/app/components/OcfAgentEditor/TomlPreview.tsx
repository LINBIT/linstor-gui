import { useTranslation } from 'react-i18next';
import { Card, Spin, Typography } from 'antd';
import { cssVar } from '@app/const/themeTokens';

const { Text } = Typography;

interface TomlPreviewProps {
  content: string;
  loading?: boolean;
  title?: string;
}

export function TomlPreview({ content, loading = false, title }: TomlPreviewProps) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Card
        title={<Text strong>{title ?? t('common:live_preview_toml')}</Text>}
        variant="borderless"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
        }}
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
          <div
            style={{
              background: cssVar('bg/surface'),
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: `1px solid ${cssVar('border/default')}`,
              overflow: 'auto',
              flex: 1,
              maxHeight: '100%',
            }}
          >
            {content}
          </div>
        </Spin>
      </Card>
    </div>
  );
}
