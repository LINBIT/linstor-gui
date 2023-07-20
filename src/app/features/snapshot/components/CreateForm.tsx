import React from 'react';
import { Form, Input, Modal, Select } from 'antd';
import uniqby from 'lodash.uniqby';

import { useNodes } from '@app/features/node';
import { useResources } from '../hooks';

type FormType = {
  name: string;
  node: string[];
  resource: string;
};

type CollectionCreateFormProps = {
  open: boolean;
  onCreate: (values: FormType) => void;
  onCancel: () => void;
};

const CreateSnapshotForm = ({ open, onCancel, onCreate }: CollectionCreateFormProps) => {
  const [form] = Form.useForm<FormType>();
  const { data: nodes } = useNodes();
  const { data: resources } = useResources();

  return (
    <Modal
      open={open}
      title="Create new snapshot"
      okText="Create"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values);
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
        <Form.Item name="name" label="Snapshot Name" required>
          <Input placeholder="Please input snapshot name" />
        </Form.Item>

        <Form.Item
          label="Resource"
          name="resource_name"
          required
          rules={[{ required: true, message: 'Please select nodes!' }]}
        >
          <Select
            allowClear
            placeholder="Please select resource"
            options={uniqby(resources, 'name')?.map((e) => ({
              label: e.name,
              value: e.name,
            }))}
          />
        </Form.Item>

        <Form.Item label="Nodes" name="nodes">
          <Select
            allowClear
            placeholder="Please select nodes"
            mode="multiple"
            options={nodes?.map((e) => ({
              label: e.name,
              value: e.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export { CreateSnapshotForm };
