// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Switch, Form, Input, Modal, Select, message } from 'antd';
import { Button } from '@app/components/Button';
import { useTranslation } from 'react-i18next';

import { createLINSTORRemote, createS3Remote } from '../api';
import { LINSTORRemoteCreateRequestBody, S3RemoteCreateRequestBody } from '../types';

type RemoteType = 's3_remotes' | 'linstor_remotes' | 'ebs_remotes';

type FormType = S3RemoteCreateRequestBody | LINSTORRemoteCreateRequestBody;

type CreateRemoteFormProps = {
  refetch: () => void;
};

const CreateRemoteForm = ({ refetch }: CreateRemoteFormProps) => {
  const [form] = Form.useForm<FormType>();
  const [modelOpen, setModelOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useTranslation(['remote', 'common']);

  const remote_type = Form.useWatch('remote_type', form);

  const createS3RemoteMutation = useMutation({
    mutationFn: (data: S3RemoteCreateRequestBody) => {
      return createS3Remote(data);
    },
  });

  const createLINSTORRemoteMutation = useMutation({
    mutationFn: (data: LINSTORRemoteCreateRequestBody) => {
      return createLINSTORRemote(data);
    },
  });

  const onFinish = async (
    values: FormType & {
      remote_type?: RemoteType;
    },
  ) => {
    const { remote_type, ...rest } = values;

    try {
      if (remote_type === 's3_remotes') {
        const res: any = await createS3RemoteMutation.mutateAsync(rest);

        if (res.error && Array.isArray(res.error)) {
          messageApi.error(res.error.map((e: any) => e.message).join(', '));
        }
      } else if (remote_type === 'linstor_remotes') {
        const res: any = await createLINSTORRemoteMutation.mutateAsync(rest);

        if (res.error && Array.isArray(res.error)) {
          messageApi.error(res.error.map((e: any) => e.message).join(', '));
        }
      }
    } catch (error) {
      console.error('create remote error', error);
      messageApi.error('Create remote error');
    }

    setModelOpen(false);
    refetch();
  };

  return (
    <>
      {contextHolder}
      <Button type="secondary" onClick={() => setModelOpen(true)}>
        + {t('common:add')}
      </Button>
      <Modal
        title={t('common:create')}
        open={modelOpen}
        onCancel={() => setModelOpen(false)}
        width={800}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={() => setModelOpen(false)}>{t('common:cancel')}</Button>
            <Button
              type="primary"
              loading={createS3RemoteMutation.isLoading || createLINSTORRemoteMutation.isLoading}
              onClick={() => onFinish(form.getFieldsValue())}
            >
              {t('common:submit')}
            </Button>
          </div>
        }
        destroyOnClose
        maskClosable={false}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          initialValues={{
            remote_type: 's3_remotes',
            use_path_style: false,
          }}
          onFinish={onFinish}
        >
          <Form.Item name="remote_type" label={t('remote:type')} required>
            <Select
              options={['s3_remotes', 'linstor_remotes', 'ebs_remotes'].map((e) => ({
                label: e,
                value: e,
                disabled: e === 'ebs_remotes',
              }))}
            />
          </Form.Item>

          <Form.Item name="remote_name" label={t('common:name')} required>
            <Input placeholder="Please input name" />
          </Form.Item>

          {remote_type === 's3_remotes' && (
            <>
              <Form.Item name="endpoint" label={t('remote:endpoint')} required>
                <Input placeholder="Please input endpoint" />
              </Form.Item>

              <Form.Item name="bucket" label={t('remote:bucket')} required>
                <Input placeholder="Please input bucket" />
              </Form.Item>

              <Form.Item name="region" label={t('remote:region')} required>
                <Input placeholder="Please input region" />
              </Form.Item>

              <Form.Item name="access_key" label={t('remote:access_key')} required>
                <Input.TextArea placeholder="Please input access key" />
              </Form.Item>

              <Form.Item name="secret_key" label={t('remote:secret_key')} required>
                <Input.TextArea placeholder="Please input secret key" />
              </Form.Item>

              <Form.Item name="use_path_style" label={t('remote:use_path_style')}>
                <Switch />
              </Form.Item>
            </>
          )}

          {remote_type === 'linstor_remotes' && (
            <>
              <Form.Item name="url" label={t('remote:url')} required>
                <Input placeholder="Please input url" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

export { CreateRemoteForm };
