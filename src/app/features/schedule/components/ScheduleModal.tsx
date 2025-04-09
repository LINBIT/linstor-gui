// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { createSchedule, modifySchedule } from '../api';
import CronInput from './CronInput';

const { Option } = Select;

interface Schedule {
  schedule_name: string;
  full_cron: string;
  inc_cron?: string;
  keep_local?: number;
  keep_remote?: number;
  on_failure: 'SKIP' | 'RETRY';
  max_retries?: number;
}

type ScheduleModalProps = {
  refetch: () => void; // Function to refetch data after creating or modifying a schedule
  schedule?: Schedule; // Optional schedule object for editing
};

const ScheduleModal = ({ refetch, schedule }: ScheduleModalProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Mutation for creating a schedule
  const createMutation = useMutation(createSchedule, {
    onSuccess: () => {
      message.success('Schedule created successfully!');
      refetch();
      handleCancel();
    },
    onError: (error) => {
      console.error('Error creating schedule:', error);
      message.error('Failed to create schedule.');
    },
  });

  // Mutation for modifying a schedule
  const modifyMutation = useMutation(
    (values: Schedule) => {
      const { schedule_name, ...restValues } = values;
      return modifySchedule(schedule?.schedule_name!, restValues);
    },
    {
      onSuccess: () => {
        refetch();
        handleCancel();
      },
      onError: (error) => {
        console.error('Error modifying schedule:', error);
        message.error('Failed to modify schedule.');
      },
    },
  );

  // Open the modal
  const showModal = () => {
    setIsModalVisible(true);
    if (schedule) {
      // If editing, set form values to the schedule's data
      form.setFieldsValue(schedule);
    }
  };

  // Close the modal
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); // Reset the form when the modal is closed
  };

  // Handle form submission
  const handleOk = () => {
    form
      .validateFields()
      .then((values: Schedule) => {
        if (schedule) {
          // If editing, call modifySchedule
          modifyMutation.mutate({ ...schedule, ...values });
        } else {
          // If creating, call createSchedule
          createMutation.mutate(values);
        }
      })
      .catch((info) => {
        console.log('Validation Failed:', info);
      });
  };

  return (
    <div>
      {/* Button to open the modal */}
      <Button onClick={showModal} type="primary">
        {schedule ? 'Edit' : 'Create'}
      </Button>

      {/* Modal with the form */}
      <Modal
        title={schedule ? 'Edit Schedule' : 'Create Schedule'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Submit"
        cancelText="Cancel"
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            on_failure: 'SKIP',
          }}
        >
          {/* Schedule Name */}
          <Form.Item
            label="Schedule Name"
            name="schedule_name"
            rules={[
              { required: true, message: 'Schedule name is required' },
              { max: 50, message: 'Schedule name cannot exceed 50 characters' },
            ]}
          >
            <Input placeholder="Enter schedule name" disabled={!!schedule} />
          </Form.Item>

          {/* Full Cron */}
          <Form.Item
            label="Full Cron Expression"
            name="full_cron"
            rules={[{ required: true, message: 'Please enter a full cron expression' }]}
          >
            {/* <Input placeholder="Enter full cron expression (e.g., * * * * *)" /> */}
            <CronInput />
          </Form.Item>

          {/* Incremental Cron */}
          <Form.Item label="Incremental Cron Expression" name="inc_cron">
            {/* <Input placeholder="Enter incremental cron expression (e.g., * * * * *)" /> */}
            <CronInput />
          </Form.Item>

          {/* Keep Local */}
          <Form.Item
            label="Keep Local Snapshots"
            name="keep_local"
            tooltip="The number of snapshots that are basis for a full backup to keep locally"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
          >
            <InputNumber placeholder="Enter number of local snapshots" style={{ width: '100%' }} />
          </Form.Item>

          {/* Keep Remote */}
          <Form.Item
            label="Keep Remote Backups"
            name="keep_remote"
            tooltip="The number of full backups to keep at the remote"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
          >
            <InputNumber placeholder="Enter number of remote backups" style={{ width: '100%' }} />
          </Form.Item>

          {/* On Failure */}
          <Form.Item
            label="On Failure"
            name="on_failure"
            tooltip="Action to take when a backup fails"
            rules={[{ required: true, message: 'Please select an action for failure' }]}
          >
            <Select>
              <Option value="SKIP">Skip</Option>
              <Option value="RETRY">Retry</Option>
            </Select>
          </Form.Item>

          {/* Max Retries */}
          <Form.Item
            label="Max Retries"
            name="max_retries"
            tooltip="How many times a failed backup should be retried if on_failure is RETRY"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
          >
            <InputNumber placeholder="Enter max retries (optional)" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleModal;
