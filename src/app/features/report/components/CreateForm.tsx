// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Radio, Select } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { CreateNetWorkInterfaceRequestBody, updateNetWorkInterface, createNetWorkInterface } from '@app/features/ip';
import { getNodes, useNodes } from '@app/features/node';
import { fullySuccess } from '@app/features/requests';

type FormType = {
  node: string;
  name: string;
  address: string;
  satellite_port: number;
  is_active: string;
};

type FormProps = {
  editing?: boolean;
};

const CreateForm = ({ editing }: FormProps) => {
  const { node, ip } = useParams() as { node: string; ip: string };
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();
  const nodes = useNodes();

  const backToList = () => {
    navigate('/inventory/ip');
  };

  const createNetWorkInterfaceMutation = useMutation({
    mutationFn: (
      data: CreateNetWorkInterfaceRequestBody & {
        node: string;
      }
    ) => {
      const { node, ...rest } = data;

      return createNetWorkInterface(node, rest);
    },
    onSuccess: (data) => {
      if (fullySuccess(data?.data)) {
        backToList();
      }
    },
  });

  const updateNetWorkInterfaceMutation = useMutation({
    mutationFn: (
      data: CreateNetWorkInterfaceRequestBody & {
        node: string;
      }
    ) => {
      const { node, ...rest } = data;

      return updateNetWorkInterface(node, rest);
    },
    onSuccess: (data) => {
      if (fullySuccess(data?.data)) {
        backToList();
      }
    },
  });

  useQuery({
    queryKey: ['getStoragePoolByNode', node],
    queryFn: () => getNodes({ nodes: [node] }),
    onSuccess: (data) => {
      const currentNode = data?.data?.[0];
      const currentNetInterface = currentNode?.net_interfaces?.find((e) => e.name === ip);
      if (currentNetInterface) {
        const { name, address, satellite_port, is_active } = currentNetInterface;
        form.setFieldsValue({
          name,
          address,
          satellite_port,
          is_active: is_active ? 'checked' : 'unchecked',
          node,
        });
      }
    },
    enabled: !!node && !!ip && editing,
  });

  const onFinish = (values: FormType) => {
    const { is_active, ...rest } = values;

    if (editing) {
      updateNetWorkInterfaceMutation.mutate({ ...rest, is_active: is_active === 'checked' });
    } else {
      createNetWorkInterfaceMutation.mutate({ ...rest, is_active: is_active === 'checked' });
    }
  };

  return (
    <Form<FormType>
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      size="large"
      layout="horizontal"
      form={form}
      initialValues={{
        is_active: 'checked',
        satellite_port: 3366,
        satellite_encryption_type: 'PLAIN',
      }}
      onFinish={onFinish}
    >
      <Form.Item label="Node" name="node" required rules={[{ required: true, message: 'Please select nodes!' }]}>
        <Select
          allowClear
          disabled={editing}
          placeholder="Please select node"
          options={nodes?.data?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
        />
      </Form.Item>

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

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
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
      </Form.Item>
    </Form>
  );
};

export { CreateForm };
