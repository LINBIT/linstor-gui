import React, { useState } from 'react';
import { Button, Form, Input, Modal, Select } from 'antd';
import uniqby from 'lodash.uniqby';

import { useNodes } from '@app/features/node';
import { useResources } from '../hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getStoragePool } from '@app/features/storagePool';
import { CreateSnapshotRequestBody } from '../types';
import { createSnapshot } from '../api';
import { notify } from '@app/utils/toast';

type FormType = {
  name: string;
  node: string[];
  resource: string;
};

type CollectionCreateFormProps = {
  refetch: () => void;
};

const CreateSnapshotForm = ({ refetch }: CollectionCreateFormProps) => {
  const [form] = Form.useForm<FormType>();
  const { data: nodes } = useNodes();
  const { data: resources } = useResources();
  const [open, setOpen] = useState(false);

  const resourceList = uniqby(resources, 'name')?.map((e) => ({
    label: e.name,
    value: e.name,
  }));

  const resource = Form.useWatch('resource_name', form);
  const resourceObj = resources?.find((e) => e.name === resource);
  const disklessNodes = resources
    ?.filter((e) => e.name === resource && e.flags?.includes('DISKLESS') && e.flags.includes('DRBD_DISKLESS'))
    .map((e) => e.node_name);
  const resourceStoragePool = resourceObj?.props?.StorPoolName;

  const { data, isLoading } = useQuery({
    queryKey: ['getStoragePool', resourceStoragePool],
    queryFn: () =>
      getStoragePool({
        storage_pools: [resourceStoragePool || ''],
      }),
    enabled: !!resourceStoragePool,
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: CreateSnapshotRequestBody) => {
      const { resource_name, ...rest } = data;
      return createSnapshot(resource_name || '', rest);
    },
    onSuccess: (data) => {
      if (data?.data && Array.isArray(data?.data)) {
        notify('Snapshot created!', {
          type: 'success',
        });
      }

      setTimeout(() => {
        setOpen(false);
        refetch();
      }, 200);
    },
    onError: () => {
      notify('Create snapshot failed!', {
        type: 'error',
      });
    },
  });

  const canDoSnapshot = data?.data?.every((e) => e.supports_snapshots);

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        Create
      </Button>
      <Modal
        open={open}
        title="Create new snapshot"
        okText="Create"
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
              createResourceMutation.mutate(values);
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
        >
          {resource && !canDoSnapshot && !isLoading && (
            <div style={{ color: 'red', marginBottom: 20 }}>
              The storage pool does not support snapshots, please select another resource
            </div>
          )}
          <Form.Item name="name" label="Snapshot Name" required>
            <Input placeholder="Please input snapshot name" />
          </Form.Item>

          <Form.Item
            label="Resource"
            name="resource_name"
            required
            rules={[{ required: true, message: 'Please select nodes!' }]}
          >
            <Select allowClear placeholder="Please select resource" options={resourceList} />
          </Form.Item>

          <Form.Item label="Nodes" name="nodes">
            <Select
              allowClear
              placeholder="Please select nodes"
              mode="multiple"
              options={nodes?.map((e) => ({
                label: e.name,
                value: e.name,
                disabled: disklessNodes?.includes(e.name),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateSnapshotForm };
