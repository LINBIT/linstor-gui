// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Input, Button, message, Form, FormProps, Radio } from 'antd';
import styled from '@emotion/styled';
import { useMutation } from '@tanstack/react-query';
import { createPassphrase, editPassphrase } from '@app/features/settings/passphrase';

const Wrapper = styled.div`
  padding: 2em 0;
  width: 20em;
`;

const Label = styled.div`
  margin-left: 4em;
  margin-bottom: 2em;
`;

type FieldType = {
  confirm: string;
  password: string;
  mode: 'create' | 'edit';
  old: string;
};

const Passphrase: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm();
  const mode = Form.useWatch('mode', form);

  const onFinish = (values: FieldType) => {
    console.log('Success:', values);
    if (values.mode === 'edit') {
      editPassphraseMutation.mutate({ passphrase: values.password, old: values.old });
    } else {
      createPassphraseMutation.mutate(values.password);
    }
  };

  const validateConfirmPassword = (_: any, value: FieldType) => {
    if (value && value !== form.getFieldValue('password')) {
      return Promise.reject(new Error('The two passphrases not match!'));
    }
    return Promise.resolve();
  };

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const createPassphraseMutation = useMutation({
    mutationKey: ['createPassphrase'],
    mutationFn: (passphrase: string) => {
      return createPassphrase(passphrase);
    },
    onSuccess: () => {
      messageApi.open({
        type: 'success',
        content: 'Saved successfully.',
      });
    },
    onError: () => {
      messageApi.open({
        type: 'error',
        content: 'Failed to save.',
      });
    },
  });

  const editPassphraseMutation = useMutation({
    mutationKey: ['editPassphrase'],
    mutationFn: ({ passphrase, old }: { passphrase: string; old: string }) => {
      return editPassphrase(passphrase, old);
    },
    onSuccess: () => {
      messageApi.open({
        type: 'success',
        content: 'Saved successfully.',
      });
    },
    onError: () => {
      messageApi.open({
        type: 'error',
        content: 'Failed to save.',
      });
    },
  });

  return (
    <>
      {contextHolder}
      <Wrapper>
        <Form
          form={form}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          style={{ minWidth: 600 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          initialValues={{ mode: 'create' }}
        >
          <Label>LINSTOR Passphrase</Label>
          <Form.Item label="Create/Edit" name="mode">
            <Radio.Group
              onChange={() => {
                form.resetFields(['old', 'password', 'confirm']);
              }}
            >
              <Radio.Button value="create"> Create </Radio.Button>
              <Radio.Button value="edit"> Edit </Radio.Button>
            </Radio.Group>
          </Form.Item>
          {mode === 'edit' ? (
            <Form.Item
              label="Old passphrase"
              name="old"
              rules={[{ required: true, message: 'Please input your old passphrase!' }]}
            >
              <Input.Password />
            </Form.Item>
          ) : null}
          <Form.Item<FieldType>
            label="Passphrase"
            name="password"
            rules={[{ required: true, message: 'Please input your passphrase!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item<FieldType>
            name="confirm"
            label="Confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your passphrase!' },
              { validator: validateConfirmPassword },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Wrapper>
    </>
  );
};

export default Passphrase;
