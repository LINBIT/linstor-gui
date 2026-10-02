import { useTranslation } from 'react-i18next';
import { EyeInvisibleOutlined, EyeOutlined, ImportOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { Button } from '@app/components/Button';

interface EditorToolbarProps {
  mode: 'edit' | 'create';
  isDirty: boolean;
  saving: boolean;
  previewVisible: boolean;
  onPaste: () => void;
  onReset: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
}

/** Paste, reset (edit mode), save and preview, next to the editor's tabs. */
export const EditorToolbar = ({
  mode,
  isDirty,
  saving,
  previewVisible,
  onPaste,
  onReset,
  onSave,
  onTogglePreview,
}: EditorToolbarProps) => {
  const { t } = useTranslation();

  return (
    <Space>
      <Button icon={<ImportOutlined />} onClick={onPaste}>
        {t('common:paste')}
      </Button>
      {mode === 'edit' && (
        <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!isDirty}>
          {t('common:reset')}
        </Button>
      )}
      <Button type="primary" icon={<SaveOutlined />} onClick={onSave} disabled={saving || !isDirty} loading={saving}>
        {t('common:save')}
      </Button>
      <Button
        type={previewVisible ? 'primary' : undefined}
        icon={previewVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        onClick={onTogglePreview}
      >
        {t('common:preview')}
      </Button>
    </Space>
  );
};
