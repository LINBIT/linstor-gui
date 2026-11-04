// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMutation } from '@tanstack/react-query';
import { Form, Modal } from 'antd';
import { Input } from '@app/components/Input';
import { useTranslation } from 'react-i18next';

import { cloneResourceDefinition, ResourceDefinitionCloneRequest } from '@app/features/resourceDefinition';
import { unwrap } from '@app/features/requests';
import { Button } from '@app/components/Button';
import { Checkbox } from '@app/components/Checkbox';

type FormType = {
  name: string;
  use_zfs_clone?: boolean;
};

type CloneModalProps = {
  open: boolean;
  resource?: string;
  isUsingZFS?: boolean;
  onClose: () => void;
  /** After the controller took the clone: the list shows it. */
  onSuccess?: () => void;
};

/**
 * Clones a resource definition. The page opens it from a row's menu, as the
 * resize dialog: inside the menu, the menu stayed open over the list after
 * cloning. A clone the controller refuses keeps the dialog with the name.
 */
const CloneModal = ({ open, resource, isUsingZFS, onClose, onSuccess }: CloneModalProps) => {
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['common', 'resource']);

  const cloneResourceMutation = useMutation({
    mutationKey: ['cloneResourceMutation'],
    mutationFn: (data: { resource: string; body: ResourceDefinitionCloneRequest }) =>
      unwrap(cloneResourceDefinition(data.resource, data.body)),
  });

  const onFinish = async (values: FormType) => {
    if (!resource) return;
    try {
      await cloneResourceMutation.mutateAsync({
        resource,
        body: { name: values.name, use_zfs_clone: values.use_zfs_clone },
      });
    } catch {
      // The request proxy reported the controller's reason.
      return;
    }
    onClose();
    onSuccess?.();
  };

  return (
    <Modal
      title={t('common:clone')}
      open={open}
      onCancel={onClose}
      width={800}
      destroyOnHidden
      footer={
        <>
          <Button type="secondary" onClick={onClose}>
            {t('common:cancel')}
          </Button>
          <Button type="primary" loading={cloneResourceMutation.isPending} onClick={() => form.submit()}>
            {t('common:clone')}
          </Button>
        </>
      }
    >
      <Form<FormType>
        className="max-w-[700px]"
        size="large"
        layout="vertical"
        form={form}
        onFinish={onFinish}
        preserve={false}
      >
        <Form.Item name="name" label={t('common:name')} required>
          <Input placeholder={t('resource:input_clone_name')} />
        </Form.Item>
        <Form.Item name="use_zfs_clone" valuePropName="checked">
          <Checkbox disabled={!isUsingZFS}>{t('common:use_zfs_clone')}</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export { CloneModal };
