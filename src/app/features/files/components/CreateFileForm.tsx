// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TextArea from 'antd/es/input/TextArea';

import Button from '@app/components/Button';
import { useCreateOrUpdateFile } from '../';

type FormType = {
  path: string;
  content: string;
};

const CreateFileForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['files', 'common']);

  const createOrUpdateMutation = useCreateOrUpdateFile();

  const onFinish = (values: FormType) => {
    const body = {
      path: values.path,
      content: btoa(values.content),
    };

    createOrUpdateMutation.mutate(
      { extFileName: values.path, body },
      {
        onSuccess: () => {
          navigate('/files');
        },
      },
    );
  };

  return (
    <Form<FormType>
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 700 }}
      size="large"
      layout="horizontal"
      form={form}
      onFinish={onFinish}
    >
      <Form.Item
        label={t('path')}
        name="path"
        required
        rules={[
          {
            required: true,
            message: t('path_required'),
          },
        ]}
      >
        <Input placeholder={t('path_placeholder')} />
      </Form.Item>

      <Form.Item
        label={t('content')}
        name="content"
        required
        rules={[
          {
            required: true,
            message: t('content_required'),
          },
        ]}
      >
        <TextArea rows={10} placeholder={t('content_placeholder')} />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit" loading={createOrUpdateMutation.isPending}>
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={() => navigate('/files')} style={{ marginLeft: 8 }}>
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateFileForm };
