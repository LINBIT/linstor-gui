import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Modal, Select } from 'antd';

import { createVolumeDefinition, getResourceDefinition, getVolumeDefinitionListByResource } from '../api';
import { CreateVolumeDefinitionRequestBody } from '../types';
import { SizeInput } from '@app/components/SizeInput';

type FormType = {
  resource: string;
  size: number;
};

type CreateFormProps = {
  refetch: () => void;
};

const CreateForm = ({ refetch }: CreateFormProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form] = Form.useForm<FormType>();

  const { data: resourceDefinition } = useQuery({
    queryKey: ['getResourceDefinition'],
    queryFn: () => getResourceDefinition({}),
    onSuccess: (data) => {
      data?.data?.forEach(async (item) => {
        if (item?.name) {
          const vd = await getVolumeDefinitionListByResource(item?.name);
          console.log(vd, 'vd');
        }
      });
    },
  });

  const createVD = useMutation({
    mutationFn: (
      data: CreateVolumeDefinitionRequestBody & {
        resource: string;
      },
    ) => {
      const { resource, ...rest } = data;
      return createVolumeDefinition(resource, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    const VDData = {
      resource: values.resource,
      volume_definition: {
        size_kib: values.size,
      },
    };

    createVD.mutate(VDData);
    setShowCreateForm(false);
    refetch && refetch();
  };

  return (
    <>
      <Button type="primary" onClick={() => setShowCreateForm(true)}>
        Create
      </Button>
      <Modal
        title="Create Volume Definition"
        open={showCreateForm}
        onOk={() => onFinish(form.getFieldsValue())}
        onCancel={() => setShowCreateForm(false)}
        okText="Spawn"
        width={800}
        okButtonProps={{
          loading: createVD.isLoading,
        }}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          initialValues={{
            place_count: 1,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            label="Resource Definition"
            name="resource"
            required
            rules={[{ required: true, message: 'Please select resource definition!' }]}
          >
            <Select
              allowClear
              placeholder="Please select resource definition"
              options={resourceDefinition?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="size" label="Size" required>
            <SizeInput />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateForm };
