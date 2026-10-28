// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
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
import { variablesOnly } from '@app/utils/mutation';

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

// A new schedule starts with a daily full backup at midnight.
const DEFAULT_FULL_CRON = '0 0 * * *';

const ScheduleModal = ({ refetch, schedule, isInDropdown = false }: ScheduleModalProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation(['schedule', 'common']);

  // Mutation for creating a schedule
  const createMutation = useMutation({
    mutationFn: variablesOnly(createSchedule),
    onSuccess: () => {
      message.success(t('schedule:created'));
      refetch();
      handleCancel();
    },
    onError: (error) => {
      logger.error('Error creating schedule:', error);
      message.error(t('schedule:create_failed'));
    },
  });

  // Mutation for modifying a schedule
  const modifyMutation = useMutation({
    mutationFn: (values: Schedule) => {
      // The name is the path parameter, not part of the modify body.
      const { schedule_name: _scheduleName, ...restValues } = values;
      if (!schedule || !schedule.schedule_name) {
        throw new Error('Schedule or schedule_name is undefined');
      }
      return modifySchedule(schedule.schedule_name, restValues);
    },

    onSuccess: () => {
      refetch();
      handleCancel();
    },

    onError: (error) => {
      logger.error('Error modifying schedule:', error);
      message.error(t('schedule:modify_failed'));
    },
  });

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
      .then(({ inc_cron, ...rest }: Schedule) => {
        // An incremental cron is optional; an empty field means none.
        const values: Schedule = inc_cron ? { ...rest, inc_cron } : rest;
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
        destroyOnHidden
        footer={
          <div className="flex justify-end gap-2">
            <Button type="secondary" onClick={handleCancel}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={handleOk} loading={createMutation.isPending || modifyMutation.isPending}>
              {t('common:submit')}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            full_cron: DEFAULT_FULL_CRON,
            on_failure: 'SKIP',
          }}
        >
          {/* Schedule Name */}
          <Form.Item
            label={t('schedule:schedule_name')}
            name="schedule_name"
            rules={[
              { required: true, message: t('schedule:name_required') },
              { max: 50, message: t('schedule:name_too_long') },
            ]}
          >
            <Input placeholder={t('schedule:enter_schedule_name')} disabled={!!schedule} />
          </Form.Item>

          {/* Full Cron */}
          <Form.Item
            label={t('schedule:full_cron_expression')}
            name="full_cron"
            rules={[{ required: true, message: t('schedule:full_cron_required') }]}
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
            tooltip={t('schedule:keep_local_tooltip')}
            rules={[{ type: 'number', min: 0, message: t('common:positive_number') }]}
          >
            <InputNumber placeholder={t('schedule:enter_number_local_snapshots')} className="w-full" />
          </Form.Item>

          {/* Keep Remote */}
          <Form.Item
            label={t('schedule:keep_remote_backups')}
            name="keep_remote"
            tooltip={t('schedule:keep_remote_tooltip')}
            rules={[{ type: 'number', min: 0, message: t('common:positive_number') }]}
          >
            <InputNumber placeholder={t('schedule:enter_number_remote_backups')} className="w-full" />
          </Form.Item>

          {/* On Failure */}
          <Form.Item
            label={t('schedule:on_failure')}
            name="on_failure"
            tooltip={t('schedule:on_failure_tooltip')}
            rules={[{ required: true, message: t('schedule:on_failure_required') }]}
          >
            <Select>
              <Option value="SKIP">{t('common:skip')}</Option>
              <Option value="RETRY">{t('common:retry')}</Option>
            </Select>
          </Form.Item>

          {/* Max Retries */}
          <Form.Item
            label={t('schedule:max_retries')}
            name="max_retries"
            tooltip={t('schedule:max_retries_tooltip')}
            rules={[{ type: 'number', min: 0, message: t('common:positive_number') }]}
          >
            <InputNumber placeholder={t('schedule:enter_max_retries_optional')} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleModal;
