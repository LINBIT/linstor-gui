// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Radio } from 'antd';

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
  const { t } = useTranslation('node_detail');

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
        title="Create network interface"
        okText="Confirm"
        cancelText="Cancel"
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        onOk={() => {
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
          <Form.Item label="Alias" name="name" required>
            <Input placeholder="Please input alias" disabled={editing} />
          </Form.Item>

          <Form.Item
            name="address"
            label="IP Address"
            required
            rules={[
              {
                pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
                message: 'Please input valid IP address',
              },
            ]}
            tooltip="Must be valid IP address, like 192.168.1.1, 10.10.1.1"
          >
            <Input placeholder="Please input IP address" />
          </Form.Item>

          <Form.Item
            name="satellite_port"
            label="TCP Port"
            required
            tooltip="Must be valid port"
            rules={[
              {
                pattern: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
                message: 'Please input valid port, 0-65535',
              },
            ]}
          >
            <Input placeholder="Please input TCP port" type="number" />
          </Form.Item>

          <Form.Item
            label="Encryption Type"
            name="satellite_encryption_type"
            tooltip="If satellite port and satellite encryption type are given the netinterface can also work as connection to the controller"
          >
            <Radio.Group>
              <Radio value="PLAIN">Plain</Radio>
              <Radio value="SSL">SSL</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox>Default IP</Checkbox>
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
