// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Modal, Input, Form } from 'antd';

interface AddColumnModalProps {
  isVisible: boolean;
  onConfirm: (values: any) => void;
  onCancel: () => void;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({ isVisible, onConfirm, onCancel }) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onConfirm(values);
        form.resetFields();
      })
      .catch((info) => {
        console.log('Validation Failed:', info);
      });
  };

  return (
    <Modal title="Add New Column" open={isVisible} onOk={handleOk} onCancel={onCancel}>
      <Form form={form} layout="vertical">
        <Form.Item label="Column Title" name="title" rules={[{ required: true, message: 'Please enter column title' }]}>
          <Input placeholder="Enter column title" />
        </Form.Item>
        <Form.Item
          label="Column Data Index"
          name="dataIndex"
          rules={[{ required: true, message: 'Please enter column data index' }]}
        >
          <Input placeholder="Enter column data index" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddColumnModal;
