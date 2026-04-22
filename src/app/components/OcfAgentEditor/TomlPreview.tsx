import { Card, Spin, Typography } from 'antd';

const { Text } = Typography;

interface TomlPreviewProps {
  content: string;
  loading?: boolean;
  currentTheme: string;
  title?: string;
}

export function TomlPreview({
  content,
  loading = false,
  currentTheme,
  title = 'Live Preview (TOML)',
}: TomlPreviewProps) {
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
        title={<Text strong>{title}</Text>}
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
            {content}
          </div>
        </Spin>
      </Card>
    </div>
  );
}
