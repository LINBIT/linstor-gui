import React, { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { useNodes } from '@app/features/node';

interface Values {
  node: string;
  resource: string;
  fromnode: string;
}

interface CollectionCreateFormProps {
  open: boolean;
  onCreate: (values: Values) => void;
  migrationInfo: any;
  onCancel: () => void;
}

export const ResourceMigrateForm: React.FC<CollectionCreateFormProps> = ({
  open,
  onCreate,
  migrationInfo,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        fromnode: migrationInfo.node,
        resource: migrationInfo.resource,
      });
    }
  }, [form, migrationInfo, open]);

  const { data: nodes } = useNodes();
  return (
    <Modal
      open={open}
      title="Migrate Resource"
      okText="Confirm"
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
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{ fromnode: migrationInfo.node, resource: migrationInfo.resource }}
      >
        <Form.Item name="fromnode" label="Form Node">
          <Input disabled />
        </Form.Item>
        <Form.Item name="resource" label="Resource">
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="node"
          label="To Node"
          rules={[
            {
              required: true,
              message: 'Please select node!',
            },
          ]}
        >
          <Select
            allowClear
            placeholder="Please select node"
            options={nodes
              ?.filter((e) => e.name !== migrationInfo.node)
              .map((e) => ({
                label: e.name,
                value: e.name,
              }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
