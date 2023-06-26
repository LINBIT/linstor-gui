import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Select } from 'antd';
import { useHistory, useParams } from 'react-router-dom';

import {
  createNode,
  getNodes,
  NetInterfaceEncryptionType,
  NodeCreateRequestBody,
  NodeType,
  updateNetwork,
  UpdateNetInterfaceRequestBody,
  updateNode,
  UpdateNodeRequestBody,
} from '@app/features/node';
import { capitalize } from '@app/utils/stringUtils';
import { fullySuccess } from '@app/features/requests';

type FormType = {
  name: string;
  address: string;
  satellite_port: number;
  type: NodeType;
};

type CreateNodeFormProps = {
  editing?: boolean;
};

const CreateNodeForm = ({ editing }: CreateNodeFormProps) => {
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const [defaultNetwork, setDefaultNetwork] = React.useState<UpdateNetInterfaceRequestBody>();

  const backToList = () => {
    history.push('/inventory/nodes');
  };

  const { node } = useParams() as { node: string };

  useQuery({
    queryKey: ['getNodeDetailByName', node],
    queryFn: () => getNodes({ nodes: [node] }),
    enabled: !!node && editing,
    onSuccess: (data) => {
      const currentNode = data?.data?.[0];

      if (currentNode) {
        const initialData = {
          name: currentNode?.name,
          address: currentNode?.net_interfaces?.[0].address,
          satellite_port: currentNode?.net_interfaces?.[0].satellite_port,
          type: capitalize(currentNode?.type) as NodeType,
        };

        setDefaultNetwork(currentNode?.net_interfaces?.find((e) => e.is_active));
        form.setFieldsValue(initialData);
      }
    },
  });

  const updateNodeNetworkMutation = useMutation({
    mutationFn: (data: { node: string; netinterface: string; body: UpdateNetInterfaceRequestBody }) =>
      updateNetwork(data),
  });

  const updateNodeMutation = useMutation({
    mutationFn: (data: { node: string; body: UpdateNodeRequestBody }) => updateNode(data),
  });

  const createNodeMutation = useMutation({
    mutationFn: (data: NodeCreateRequestBody) => createNode(data),
    onSuccess: () => {
      setTimeout(() => backToList(), 1000);
    },
  });

  const onFinish = async (values: FormType) => {
    if (editing) {
      const data = {
        node,
        netinterface: defaultNetwork?.name as string,
        body: {
          ...defaultNetwork,
          name: defaultNetwork?.name as string,
          address: values.address,
          satellite_port: values.satellite_port,
        },
      };

      const [updateNodeNetworkMutationRes, updateNodeMutationRes] = await Promise.all([
        updateNodeNetworkMutation.mutateAsync(data),
        updateNodeMutation.mutateAsync({ node, body: { node_type: values.type } }),
      ]);

      if (fullySuccess(updateNodeNetworkMutationRes.data && updateNodeMutationRes.data)) {
        history.goBack();
      }

      return;
    }

    const data = {
      name: values.name,
      type: values.type,
      net_interfaces: [
        {
          name: 'default',
          address: values.address,
          satellite_port: values.satellite_port,
          satellite_encryption_type: 'PLAIN' as NetInterfaceEncryptionType,
          is_active: true,
        },
      ],
    };

    createNodeMutation.mutate(data);
  };

  return (
    <Form<FormType>
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 500 }}
      size="large"
      layout="horizontal"
      form={form}
      onFinish={onFinish}
      initialValues={{
        satellite_port: 3366,
        type: 'Satellite',
      }}
    >
      <Form.Item
        label="Name"
        name="name"
        required
        rules={[
          {
            required: true,
            message: 'Node name is required!',
          },
        ]}
      >
        <Input placeholder="Please input node name" disabled={editing} />
      </Form.Item>

      <Form.Item label="Type" name="type" required rules={[{ required: true, message: 'Please select node type!' }]}>
        <Select
          allowClear
          placeholder="Please select resource group"
          options={['Controller', 'Satellite', 'Combined', 'Auxiliary', 'Openflex_Target']?.map((e) => ({
            label: e,
            value: e,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="address"
        label="IP Address"
        required
        rules={[
          {
            required: true,
            message: 'IP address is required!',
          },
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
        label="Port"
        required
        tooltip="Must be valid port"
        rules={[
          {
            pattern: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
            message: 'Please input valid port, 0-65535',
          },
        ]}
      >
        <Input placeholder="Please input port" type="number" />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>

        <Button type="text" onClick={backToList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateNodeForm };
