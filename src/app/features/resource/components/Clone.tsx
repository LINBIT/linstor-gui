// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Checkbox, Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';

import { cloneResourceDefinition, ResourceDefinitionCloneRequest } from '@app/features/resourceDefinition';
import { Button } from '@app/components/Button';

type FormType = {
  name: string;
  use_zfs_clone?: boolean;
};

type SpawnFormProps = {
  resource?: string;
  isUsingZFS?: boolean;
};

const CloneForm = ({ resource, isUsingZFS }: SpawnFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['common', 'resource_definitions']);

  const cloneResourceMutation = useMutation({
    mutationKey: ['cloneResourceMutation'],
    mutationFn: (data: { resource: string; body: ResourceDefinitionCloneRequest }) => {
      const { resource, body } = data;
      return cloneResourceDefinition(resource, body);
    },
  });

  const onFinish = async (values: FormType) => {
    const body = {
      name: values.name,
      use_zfs_clone: values.use_zfs_clone,
    };

    cloneResourceMutation.mutate({
      resource: resource!,
      body,
    });
    setShowForm(false);
  };

  return (
    <>
      <span onClick={() => setShowForm(true)}>{t('common:clone')}</span>
      <Modal
        title={t('common:clone')}
        open={showForm}
        onCancel={() => setShowForm(false)}
        width={800}
        footer={
          <>
            <Button type="secondary" onClick={() => setShowForm(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" loading={cloneResourceMutation.isLoading} onClick={() => form.submit()}>
              {t('common:clone')}
            </Button>
          </>
        }
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          onFinish={onFinish}
        >
          <Form.Item name="name" label={t('common:name')} required>
            <Input placeholder="Input clone name" />
          </Form.Item>

          <Form.Item name="use_zfs_clone" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox disabled={!isUsingZFS}>{t('common:use_zfs_clone')}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CloneForm };
