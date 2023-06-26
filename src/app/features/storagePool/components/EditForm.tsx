import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Radio, Select } from 'antd';
import { useHistory, useParams } from 'react-router-dom';

import {
  ProviderKind,
  getStoragePoolByNode,
  updateStoragePool,
  UpdateStoragePoolRequestBody,
} from '@app/features/storagePool';
import { getNetworksByNode, useNodes } from '@app/features/node';
import { fullySuccess } from '@app/features/requests';

type FormType = {
  pool_name: string;
  network: string;
  node: string;
  provider_kind: ProviderKind;
  storage_driver_name: string;
};

const EditForm = () => {
  const nodes = useNodes();
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const provider_kind = Form.useWatch('provider_kind', form);

  const { node, storagePool } = useParams() as { node: string; storagePool: string };

  const backToStoragePoolList = () => {
    history.push('/inventory/storage-pools');
  };

  useQuery({
    queryKey: ['getStoragePoolByNode', node],
    queryFn: () => getStoragePoolByNode(node),
    onSuccess: (data) => {
      const currentStoragePool = data?.data?.find((e) => e.storage_pool_name === storagePool);
      form.setFieldsValue({
        pool_name: currentStoragePool?.storage_pool_name,
        node: currentStoragePool?.node_name,
        provider_kind: currentStoragePool?.provider_kind,
        storage_driver_name: currentStoragePool?.props?.['StorDriver/StorPoolName'],
        network: currentStoragePool?.props?.PrefNic,
      });
    },
  });

  const updateStoragePoolMutation = useMutation({
    mutationFn: (data: UpdateStoragePoolRequestBody) => updateStoragePool({ node, storagepool: storagePool }, data),
  });

  const { data: networkData } = useQuery({
    queryKey: ['getNetworksByNode', node],
    queryFn: () => getNetworksByNode(node),
  });

  // should be DISKLESS, LVM, LVM_THIN, ZFS, ZFS_THIN, OPENFLEX_TARGET, FILE, FILE_THIN, SPDK, EBS_TARGET, EBS_INIT
  // but for now, we only support LVM and LVM_THIN
  const typeList = [
    { label: 'LVM', value: 'LVM' },
    { label: 'LVM_THIN', value: 'LVM_THIN' },
    { label: 'DISKLESS', value: 'DISKLESS' },
  ];

  const onFinish = (values: FormType) => {
    updateStoragePoolMutation.mutate(
      {
        delete_namespaces: [],
        delete_props: [],
        override_props: {
          PrefNic: values.network,
        },
      },
      {
        onSuccess: (data) => {
          if (fullySuccess(data.data)) {
            setTimeout(() => {
              history.push('/inventory/storage-pools');
            }, 1000);
          }
        },
      }
    );
  };

  return (
    <Form
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      size="large"
      layout="horizontal"
      form={form}
      onFinish={onFinish}
    >
      <Form.Item
        name="pool_name"
        label="Storage Pool Name"
        required
        rules={[
          { required: true, message: 'Please input storage pool name!' },
          {
            pattern: new RegExp('^(?!-)[a-zA-Z_][a-zA-Z0-9_-]{1,47}[-a-zA-Z0-9_]$'),
            message: 'Please input a valid storage pool name!',
          },
        ]}
      >
        <Input placeholder="Please input storage pool name" disabled />
      </Form.Item>

      <Form.Item label="Nodes" name="node" required rules={[{ required: true, message: 'Please select nodes!' }]}>
        <Select
          disabled
          allowClear
          placeholder="Please select"
          options={nodes?.data?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
        />
      </Form.Item>

      <Form.Item label="Network Preference" name="network">
        <Select
          allowClear
          placeholder="Please select"
          options={networkData?.data?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
        />
      </Form.Item>

      <Form.Item label="Type" name="provider_kind" required>
        <Radio.Group disabled>
          {typeList.map((e) => {
            return (
              <Radio value={e.value} key={e.value}>
                {e.label}
              </Radio>
            );
          })}
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="storage_driver_name"
        label={provider_kind === 'LVM' ? 'Volume Group' : 'Volume Group/Thin Pool'}
        required
      >
        <Input
          disabled
          placeholder={`Please input ${provider_kind === 'LVM_THIN' ? 'Volume Group/Thin Pool' : 'Volume Group'}`}
        />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>

        <Button type="text" onClick={backToStoragePoolList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { EditForm };
