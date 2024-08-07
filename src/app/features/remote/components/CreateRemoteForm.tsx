import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Radio, Select } from 'antd';
import { useHistory } from 'react-router-dom';
import uniqby from 'lodash.uniqby';

import { getNetWorkInterfaceByNode } from '@app/features/ip';
import { fullySuccess } from '@app/features/requests';
import { autoPlace, resourceCreateOnNode } from '../api';
import { AutoPlaceRequestBody } from '../types';

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

const CreateRemoteForm = () => {
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const [modelOpen, setModelOpen] = useState(false);

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

  const createRemoteMutation = useMutation({
    mutationFn: (
      data: RemoteCreateRequestBody & {
        node: string;
        resource_name: string;
      },
    ) => {
      const { node, resource_name, ...rest } = data;
      return resourceCreateOnNode(resource_name, node, rest);
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

      const createRemoteRes = await createRemoteMutation.mutateAsync({
        node: values.node,
        resource_name: values.name,
        ...resourceData,
      });

      if (fullySuccess(createRemoteRes.data)) {
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

  return (
    <>
      <Button type="primary" onClick={() => setModelOpen(true)}>
        Add
      </Button>
      <Modal
        title="Create"
        open={modelOpen}
        onOk={() => onFinish(form.getFieldsValue())}
        onCancel={() => setModelOpen(false)}
        okText="Spawn"
        width={800}
        okButtonProps={{
          loading: autoPlaceMutation.isLoading,
        }}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          initialValues={{}}
          onFinish={onFinish}
        >
          <Form.Item name="name" label="Name" required>
            <Input placeholder="Please input name" />
          </Form.Item>

          <Form.Item name="endpoint" label="Endpoint" required>
            <Input placeholder="Please input endpoint" />
          </Form.Item>

          <Form.Item name="bucket" label="Bucket" required>
            <Input placeholder="Please input bucket" />
          </Form.Item>

          <Form.Item name="region" label="Region" required>
            <Input placeholder="Please input region" />
          </Form.Item>

          <Form.Item name="access_key" label="Access key" required>
            <Input.TextArea placeholder="Please input access key" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateRemoteForm };
