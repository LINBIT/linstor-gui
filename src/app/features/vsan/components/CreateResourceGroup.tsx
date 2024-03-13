import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Select, Space } from 'antd';

import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createNVMEExport, createResourceGroup, deleteResourceGroup, getResourceGroups, getStoragePool } from '../api';
import { notify } from '@app/utils/toast';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { DEFAULT_SP } from '@app/const/type';

type FormType = {
  name: string;
  poolName: string | null;
  placeCount: number;
};

export const CreateResourceGroup = () => {
  const [form] = Form.useForm<FormType>();
  const [createFormModal, setCreateFormModal] = useState(false);

  const { data: storagePool, refetch } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    setCreateFormModal(false);
  };

  const createMutation = useMutation({
    mutationFn: createResourceGroup,
    onSuccess: () => {
      notify('Create resource group successfully', {
        type: 'success',
      });
      setCreateFormModal(false);
      refetch();
    },
    onError: (err) => {
      console.log(err);
      notify('Create resource group failed', {
        type: 'error',
      });
    },
  });

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();

      if (values.poolName === '---any---') {
        values.poolName = null;
      }

      createMutation.mutate({
        name: values.name,
        placeCount: values.placeCount,
        poolName: values.poolName,
      });
    } catch (error) {
      console.log('Failed:', error);
    }
  };

  return (
    <>
      <Button type="primary" onClick={() => setCreateFormModal(true)}>
        Create
      </Button>

      <Modal
        title="Create"
        open={createFormModal}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Create"
        width={800}
        okButtonProps={{
          loading: createMutation.isLoading,
        }}
      >
        <Form<FormType>
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          style={{ maxWidth: 800 }}
          size="large"
          layout="horizontal"
          form={form}
          onFinish={onFinish}
          initialValues={{
            placeCount: 2,
            poolName: '---any---',
          }}
        >
          <Form.Item
            label="Resource Group:"
            name="name"
            required
            rules={[{ required: true, message: 'Please input resource group name!' }]}
            tooltip="The name of a resource group has to be at least 2 characters long and can not be longer than 48 characters.
            Valid characters are a-z, A-Z, and 0-9 as well as _ and -
            Be aware that the name cannot start or end with - and cannot start with a number."
          >
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item
            label="Storage Pool:"
            name="poolName"
            required
            rules={[{ required: true, message: 'Please select resource group!' }]}
            tooltip="The option '---any---' means that LINSTOR will choose an available storage pool for the resource group on its own."
          >
            <Select
              allowClear
              placeholder="Please select resource group"
              options={storagePool?.data
                ?.filter((e) => e.name !== DEFAULT_SP)
                ?.concat({ name: '---any---' })
                ?.map((e) => ({
                  label: e.name,
                  value: e.name,
                }))}
            />
          </Form.Item>

          <Form.Item
            label="Replica count:"
            name="placeCount"
            rules={[
              {
                required: true,
              },
            ]}
            tooltip="At LINBIT, in general, we use the expression 2 replicas to indicate that the data is stored on 2 storage devices. If you set the replica to 3, it means that the data will be stored on 3 storage devices."
          >
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
