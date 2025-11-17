// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Modal } from 'antd';
import { Button } from '@app/components/Button';
import { Checkbox } from '@app/components/Checkbox';
import { Radio } from '@app/components/Radio';

import { CreateNetWorkInterfaceRequestBody, createNetWorkInterface } from '@app/features/ip';
import { fullySuccess } from '@app/features/requests';
import { useTranslation } from 'react-i18next';

type FormType = {
  node: string;
  name: string;
  address: string;
  satellite_port: number;
  is_active: string;
};

type FormProps = {
  editing?: boolean;
  node?: string;
  refetch: () => void;
};

const CreateForm = ({ editing, node, refetch }: FormProps) => {
  const [form] = Form.useForm<FormType>();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['node_detail', 'common']);

  const createNetWorkInterfaceMutation = useMutation({
    mutationFn: (data: CreateNetWorkInterfaceRequestBody) => {
      return createNetWorkInterface(node ?? '', data);
    },
    onSuccess: (data) => {
      if (fullySuccess(data?.data)) {
        refetch();
        setOpen(false);
      }
    },
  });

  const onFinish = (values: FormType) => {
    const { is_active, ...rest } = values;
    createNetWorkInterfaceMutation.mutate({ ...rest, is_active: is_active === 'checked' });
  };

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('add_network_interface')}
      </Button>
      <Modal
        open={open}
        title={t('create_network_interface')}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              form.resetFields();
              setOpen(false);
            }}
          >
            {t('common:cancel')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={createNetWorkInterfaceMutation.isLoading}
            onClick={() => {
              form
                .validateFields()
                .then((values) => {
                  form.resetFields();
                  onFinish(values);
                })
                .catch((info) => {
                  console.log('Validate Failed:', info);
                });
            }}
          >
            {t('common:confirm')}
          </Button>,
        ]}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          size="large"
          layout="horizontal"
          form={form}
          initialValues={{
            satellite_port: 3366,
            satellite_encryption_type: 'PLAIN',
            node,
          }}
          onFinish={onFinish}
        >
          <Form.Item label={t('alias')} name="name" required>
            <Input placeholder={t('please_input_alias')} disabled={editing} />
          </Form.Item>

          <Form.Item
            name="address"
            label={t('ip_address')}
            required
            rules={[
              {
                pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
                message: t('please_input_valid_ip_address'),
              },
            ]}
            tooltip={t('valid_ip_tooltip')}
          >
            <Input placeholder={t('please_input_ip_address')} />
          </Form.Item>

          <Form.Item
            name="satellite_port"
            label={t('tcp_port')}
            required
            tooltip={t('valid_port_tooltip')}
            rules={[
              {
                pattern: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
                message: t('please_input_valid_port'),
              },
            ]}
          >
            <Input placeholder={t('please_input_tcp_port')} type="number" />
          </Form.Item>

          <Form.Item label={t('encryption_type')} name="satellite_encryption_type" tooltip={t('encryption_tooltip')}>
            <Radio.Group>
              <Radio value="PLAIN">{t('plain')}</Radio>
              <Radio value="SSL">{t('ssl')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox>{t('default_ip')}</Checkbox>
          </Form.Item>

          {/* <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateNetWorkInterfaceMutation.isLoading || createNetWorkInterfaceMutation.isLoading}
            >
              Submit
            </Button>

            <Button type="text" onClick={backToList}>
              Cancel
            </Button>
          </Form.Item> */}
        </Form>
      </Modal>
    </>
  );
};

export { CreateForm };
