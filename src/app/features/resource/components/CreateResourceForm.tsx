import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Radio, Select } from 'antd';
import { useHistory } from 'react-router-dom';
import uniqby from 'lodash.uniqby';

import { useStoragePools } from '@app/features/storagePool';
import { useResourceDefinitions } from '@app/features/resourceDefinition';
import { useNodes } from '@app/features/node';
import { getNetWorkInterfaceByNode } from '@app/features/ip';
import { fullySuccess } from '@app/features/requests';
import { autoPlace, resourceCreateOnNode } from '../api';
import { AutoPlaceRequestBody, ResourceCreateRequestBody } from '../types';

type FormType = {
  allocate_method: 'manual' | 'auto';
  name: string;
  node: string;
  storage_pool: string;
  size: number;
  deploy: boolean;
  place_count: number;
  diskless: boolean;
  network_preference: string;
};

const CreateResourceForm = () => {
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const { isLoading: storagePoolsIsLoading, data: storagePools } = useStoragePools();
  const { isLoading: resourceDefinitionIsLoading, data: resourceDefinitions } = useResourceDefinitions();
  const { isLoading: nodesIsLoading, data: nodes } = useNodes();

  const allocate_method = Form.useWatch('allocate_method', form);
  const node = Form.useWatch('node', form);

  const backToList = () => {
    history.push('/software-defined/resources');
  };

  const { data: networks } = useQuery({
    queryKey: ['getNetworkByNode', node],
    queryFn: () => getNetWorkInterfaceByNode(node),
    enabled: !!node,
  });

  const createResourceMutation = useMutation({
    mutationFn: (
      data: ResourceCreateRequestBody & {
        node: string;
        resource_name: string;
      }
    ) => {
      const { node, resource_name, ...rest } = data;
      return resourceCreateOnNode(resource_name, node, rest);
    },
  });

  const autoPlaceMutation = useMutation({
    mutationFn: (
      data: AutoPlaceRequestBody & {
        resource: string;
      }
    ) => {
      const { resource, ...rest } = data;
      return autoPlace(resource, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    if (values.allocate_method === 'manual') {
      const resourceData = {
        resource: {
          name: values.name,
          node_name: values.node,
          props: { StorPoolName: values.storage_pool, PrefNic: values.network_preference },
        },
      };

      if (values.diskless) {
        Object.assign(resourceData, {
          resource: {
            ...resourceData.resource,
            flags: ['DISKLESS'],
          },
        });
      }

      const createResourceRes = await createResourceMutation.mutateAsync({
        node: values.node,
        resource_name: values.name,
        ...resourceData,
      });

      if (fullySuccess(createResourceRes.data)) {
        backToList();
      }
    } else {
      const placeData = {
        diskless_on_remaining: values.diskless,
        select_filter: { place_count: Number(values.place_count), storage_pool: values.storage_pool },
      };

      const autoPlaceRes = await autoPlaceMutation.mutateAsync({
        resource: values.name,
        ...placeData,
      });

      if (fullySuccess(autoPlaceRes.data)) {
        backToList();
      }
    }
  };

  const isLoading = createResourceMutation.isLoading || autoPlaceMutation.isLoading;
  const isDisabled = resourceDefinitionIsLoading || storagePoolsIsLoading || nodesIsLoading;

  return (
    <Form<FormType>
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 700 }}
      size="large"
      layout="horizontal"
      form={form}
      initialValues={{
        allocate_method: 'auto',
        place_count: 2,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        label="Resource Definition Name"
        name="name"
        required
        rules={[
          {
            required: true,
            message: 'Resource definition name is required!',
          },
        ]}
      >
        <Select
          allowClear
          placeholder="Please select resource definition group"
          options={resourceDefinitions?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
        />
      </Form.Item>

      <Form.Item label="Allocate Method" name="allocate_method" required>
        <Radio.Group>
          <Radio value="auto">Auto</Radio>
          <Radio value="manual">Manual</Radio>
        </Radio.Group>
      </Form.Item>

      {allocate_method === 'manual' && (
        <>
          <Form.Item label="Node" name="node" required rules={[{ required: true, message: 'Please select nodes!' }]}>
            <Select
              allowClear
              placeholder="Please select node"
              options={nodes?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item label="Network Preference" name="network_preference">
            <Select
              allowClear
              placeholder="Please select network preference"
              options={networks?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>
        </>
      )}

      <Form.Item
        label="Storage Pool"
        name="storage_pool"
        required
        rules={[{ required: true, message: 'Please select storage pool!' }]}
      >
        <Select
          allowClear
          placeholder="Please select storage pool"
          options={uniqby(storagePools, 'storage_pool_name')?.map((e) => ({
            label: e.storage_pool_name,
            value: e.storage_pool_name,
          }))}
        />
      </Form.Item>

      <Form.Item name="place_count" label="Place Count" required>
        <Input placeholder="Please input place count" type="number" min={0} />
      </Form.Item>
      <Form.Item name="diskless" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
        <Checkbox>Diskless</Checkbox>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={isLoading} disabled={isDisabled}>
          Submit
        </Button>

        <Button type="text" onClick={backToList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateResourceForm };
