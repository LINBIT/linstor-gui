import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Radio, Select, Switch } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import uniqby from 'lodash.uniqby';

import { useStoragePools } from '@app/features/storagePool';
import { useResourceDefinitions } from '@app/features/resourceDefinition';
import { useNodes } from '@app/features/node';
import { getNetWorkInterfaceByNode } from '@app/features/ip';
import { fullySuccess } from '@app/features/requests';
import { autoPlace, resourceCreateOnNode, resourceModify } from '../api';
import { AutoPlaceRequestBody, ResourceCreateRequestBody, ResourceModifyRequestBody } from '../types';

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
  DRBD_DISKLESS: boolean;
};

type CreateResourceFormProps = {
  isEdit?: boolean;
  initialValues?: Partial<FormType>;
};

const CreateResourceForm = ({ isEdit, initialValues }: CreateResourceFormProps) => {
  const history = useHistory();
  const { resource, node: nodeFromURL } = useParams() as { resource: string; node: string };
  const [form] = Form.useForm<FormType>();
  const { isLoading: storagePoolsIsLoading, data: storagePools } = useStoragePools();
  const { isLoading: resourceDefinitionIsLoading, data: resourceDefinitions } = useResourceDefinitions();
  const { isLoading: nodesIsLoading, data: nodes } = useNodes();

  const allocate_method = Form.useWatch('allocate_method', form);
  const node = Form.useWatch('node', form);

  const backToList = () => {
    history.push('/storage-configuration/resources');
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
      },
    ) => {
      const { node, resource_name, ...rest } = data;
      return resourceCreateOnNode(resource_name, node, rest);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (
      data: ResourceModifyRequestBody & {
        resource: string;
        node: string;
      },
    ) => {
      const { resource, node, ...rest } = data;
      return resourceModify(resource, node, rest);
    },
  });

  const autoPlaceMutation = useMutation({
    mutationFn: (
      data: AutoPlaceRequestBody & {
        resource: string;
      },
    ) => {
      const { resource, ...rest } = data;
      return autoPlace(resource, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    if (isEdit) {
      let updateData: ResourceModifyRequestBody;

      if (values.network_preference !== '') {
        updateData = {
          override_props: { StorPoolName: values.storage_pool, PrefNic: values.network_preference },
          delete_props: [],
        };
      } else {
        updateData = { override_props: { StorPoolName: values.storage_pool }, delete_props: ['PrefNic'] };
      }

      await updateMutation.mutateAsync({
        resource,
        node: nodeFromURL,
        ...updateData,
      });

      return;
    }

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

      if (values.DRBD_DISKLESS) {
        Object.assign(resourceData, {
          resource: {
            ...resourceData.resource,
            flags: ['DRBD_DISKLESS'],
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
  const isAuto = allocate_method === 'auto';

  const spList = isAuto
    ? uniqby(storagePools, 'storage_pool_name')
        ?.filter((e) => {
          return e.provider_kind !== 'DISKLESS';
        })
        .map((e) => ({
          label: e.storage_pool_name,
          value: e.storage_pool_name,
        }))
    : uniqby(storagePools, 'storage_pool_name')?.map((e) => ({
        label: e.storage_pool_name,
        value: e.storage_pool_name,
      }));

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
        ...initialValues,
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
          disabled={isEdit}
        />
      </Form.Item>

      {!isEdit && (
        <Form.Item label="Allocate Method" name="allocate_method" required>
          <Radio.Group>
            <Radio value="auto">Auto</Radio>
            <Radio value="manual">Manual</Radio>
          </Radio.Group>
        </Form.Item>
      )}

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

          <Form.Item label="Storage Pool" name="storage_pool">
            <Select allowClear placeholder="Please select storage pool" options={spList} />
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

      {!isEdit && allocate_method !== 'manual' && (
        <>
          <Form.Item
            label="Storage Pool"
            name="storage_pool"
            required
            rules={[
              {
                required: true,
                message: 'Please select storage pool!',
              },
            ]}
          >
            <Select allowClear placeholder="Please select storage pool" options={spList} />
          </Form.Item>
          <Form.Item name="place_count" label="Place Count" required>
            <Input placeholder="Please input place count" type="number" min={0} />
          </Form.Item>

          <Form.Item name="diskless" label="Diskless on remaining">
            <Switch />
          </Form.Item>
        </>
      )}

      <Form.Item name="DRBD_DISKLESS" label="DRBD Diskless">
        <Switch />
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
