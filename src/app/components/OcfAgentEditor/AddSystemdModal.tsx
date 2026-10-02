import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Modal } from 'antd';
import { Button } from '@app/components/Button';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';

interface AddSystemdModalProps {
  open: boolean;
  /** Adds the unit; true once added, which also clears the dialog. */
  onAdd: (type: 'service' | 'mount', unitName: string) => boolean;
  onCancel: () => void;
}

/** Asks for a systemd service or mount unit to start alongside the resource agents. */
export const AddSystemdModal = ({ open, onAdd, onCancel }: AddSystemdModalProps) => {
  const { t } = useTranslation();
  const [systemdType, setSystemdType] = useState<'service' | 'mount'>('service');
  const [systemdUnitName, setSystemdUnitName] = useState('');

  // Every opening starts from a service with no name.
  const clear = () => {
    setSystemdType('service');
    setSystemdUnitName('');
  };

  const handleAdd = () => {
    if (onAdd(systemdType, systemdUnitName)) clear();
  };

  const handleCancel = () => {
    clear();
    onCancel();
  };

  return (
    <Modal
      title={t('common:add_systemd_mount')}
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t('common:cancel')}
        </Button>,
        <Button key="add" type="primary" onClick={handleAdd}>
          {t('common:add')}
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label={t('common:unit_type')} required>
          <Select
            value={systemdType}
            onChange={(value) => setSystemdType(value)}
            options={[
              { label: 'Service', value: 'service' },
              { label: 'Mount', value: 'mount' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t('common:unit_name')}
          required
          extra={systemdType === 'mount' ? t('common:examples_mount_unit') : t('common:examples_service_unit')}
        >
          <Input
            value={systemdUnitName}
            onChange={(e) => setSystemdUnitName(e.target.value)}
            placeholder={systemdType === 'mount' ? 'var-lib-mysql.mount' : 'mysql.service'}
            onPressEnter={handleAdd}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
