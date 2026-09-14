// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { logger } from '@app/utils/logger';
import { Modal, Form, message } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';
import { InputNumber } from '@app/components/InputNumber';
import { Button } from '@app/components/Button';
import { useMutation } from '@tanstack/react-query';
import { createSchedule, modifySchedule } from '../api';
import CronInput from './CronInput';
import { useTranslation } from 'react-i18next';

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

// 添加 isInDropdown 到组件属性
type ScheduleModalProps = {
  refetch: () => void;
  schedule?: Schedule;
  isInDropdown?: boolean;
};

const ScheduleModal = ({ refetch, schedule, isInDropdown = false }: ScheduleModalProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation(['schedule', 'common']);

  // Mutation for creating a schedule
  const createMutation = useMutation(createSchedule, {
    onSuccess: () => {
      message.success('Schedule created successfully!');
      refetch();
      handleCancel();
    },
    onError: (error) => {
      logger.error('Error creating schedule:', error);
      message.error('Failed to create schedule.');
    },
  });

  // Mutation for modifying a schedule
  const modifyMutation = useMutation(
    (values: Schedule) => {
      const { schedule_name, ...restValues } = values;
      if (!schedule || !schedule.schedule_name) {
        throw new Error('Schedule or schedule_name is undefined');
      }
      return modifySchedule(schedule.schedule_name, restValues);
    },
    {
      onSuccess: () => {
        refetch();
        handleCancel();
      },
      onError: (error) => {
        logger.error('Error modifying schedule:', error);
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
        logger.debug('Validation Failed:', info);
      });
  };

  return (
    <div>
      {/* Button or text to open the modal */}
      {isInDropdown ? (
        <span onClick={showModal}>{schedule ? t('common:edit') : t('common:create')}</span>
      ) : (
        <Button onClick={showModal} type="secondary">
          {schedule ? t('common:edit') : `+ ${t('common:add')}`}
        </Button>
      )}

      {/* Modal with the form */}
      <Modal
        title={schedule ? 'Edit Schedule' : 'Create Schedule'}
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="secondary" onClick={handleCancel}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={handleOk} loading={createMutation.isLoading || modifyMutation.isLoading}>
              {t('common:submit')}
            </Button>
          </div>
        }
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
            label={t('schedule:schedule_name')}
            name="schedule_name"
            rules={[
              { required: true, message: 'Schedule name is required' },
              { max: 50, message: 'Schedule name cannot exceed 50 characters' },
            ]}
          >
            <Input placeholder={t('schedule:enter_schedule_name')} disabled={!!schedule} />
          </Form.Item>

          {/* Full Cron */}
          <Form.Item
            label={t('schedule:full_cron_expression')}
            name="full_cron"
            rules={[{ required: true, message: 'Please enter a full cron expression' }]}
          >
            {/* <Input placeholder={t('schedule:enter_full_cron_expression_e_g')} /> */}
            <CronInput />
          </Form.Item>

          {/* Incremental Cron */}
          <Form.Item label={t('schedule:incremental_cron_expression')} name="inc_cron">
            {/* <Input placeholder={t('schedule:enter_incremental_cron_expression_e_g')} /> */}
            <CronInput />
          </Form.Item>

          {/* Keep Local */}
          <Form.Item
            label={t('schedule:keep_local_snapshots')}
            name="keep_local"
            tooltip="The number of snapshots that are basis for a full backup to keep locally"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
          >
            <InputNumber placeholder={t('schedule:enter_number_local_snapshots')} style={{ width: '100%' }} />
          </Form.Item>

          {/* Keep Remote */}
          <Form.Item
            label={t('schedule:keep_remote_backups')}
            name="keep_remote"
            tooltip="The number of full backups to keep at the remote"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
          >
            <InputNumber placeholder={t('schedule:enter_number_remote_backups')} style={{ width: '100%' }} />
          </Form.Item>

          {/* On Failure */}
          <Form.Item
            label={t('schedule:on_failure')}
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
            label={t('schedule:max_retries')}
            name="max_retries"
            tooltip="How many times a failed backup should be retried if on_failure is RETRY"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
          >
            <InputNumber placeholder={t('schedule:enter_max_retries_optional')} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleModal;
