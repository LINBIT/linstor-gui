// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Form } from 'antd';
import { Input } from '@app/components/Input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TextArea from 'antd/es/input/TextArea';

import Button from '@app/components/Button';
import { UIMode } from '@app/features/settings/types';
import { useUIMode } from '@app/features/settings/useSettings';
import { useCreateOrUpdateFile } from '../';

type FormType = {
  path: string;
  content: string;
};

const CreateFileForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['files', 'common']);
  const listPath = useUIMode() === UIMode.HCI ? '/hci/files' : '/files';

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
          navigate(listPath);
        },
      },
    );
  };

  return (
    <Form<FormType> className="max-w-[700px]" size="large" layout="vertical" form={form} onFinish={onFinish}>
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

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={createOrUpdateMutation.isPending}>
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={() => navigate(listPath)} className="ml-2">
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateFileForm };
