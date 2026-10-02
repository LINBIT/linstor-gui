import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography } from 'antd';
import { Input } from '@app/components/Input';

const { Text } = Typography;

interface PasteTomlModalProps {
  open: boolean;
  /** Applies the pasted configuration; true once applied, which also clears the text. */
  onConfirm: (content: string) => boolean;
  onCancel: () => void;
}

/** Takes a drbd-reactor configuration to load into the editor. */
export const PasteTomlModal = ({ open, onConfirm, onCancel }: PasteTomlModalProps) => {
  const { t } = useTranslation();
  // Kept across a cancel, so reopening shows what was pasted before.
  const [pastedToml, setPastedToml] = useState('');

  return (
    <Modal
      title={t('common:paste_toml_configuration')}
      open={open}
      onOk={() => {
        if (onConfirm(pastedToml)) setPastedToml('');
      }}
      onCancel={onCancel}
      width={800}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{t('common:paste_toml_hint')}</Text>
      </div>
      <Input.TextArea
        rows={15}
        placeholder="[[promoter]]&#10;  [promoter.resources.my-resource]&#10;    start = [ ... ]"
        value={pastedToml}
        onChange={(e) => setPastedToml(e.target.value)}
        style={{ fontFamily: 'monospace' }}
      />
    </Modal>
  );
};
