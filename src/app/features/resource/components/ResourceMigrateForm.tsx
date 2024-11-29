// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['common', 'resource']);

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
      title={t('resource:migrate')}
      okText={t('common:confirm')}
      cancelText={t('common:cancel')}
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
        <Form.Item name="fromnode" label={t('resource:from')}>
          <Input disabled />
        </Form.Item>
        <Form.Item name="resource" label={t('resource:resource')}>
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="node"
          label={t('resource:to')}
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
