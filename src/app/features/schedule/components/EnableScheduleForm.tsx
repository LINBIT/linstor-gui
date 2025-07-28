import React, { useState } from 'react';
import { Modal, Form, Button, message, Select } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BackupSchedule, enableSchedule, getScheduleList } from '@app/features/schedule';
import { getRemoteList } from '@app/features/remote';
import { getResources } from '@app/features/resource';
import _ from 'lodash';
import { getResourceGroups } from '@app/features/resourceGroup';
import { useNodes } from '@app/features/node';

interface EnableScheduleFormProps {
  remote_name?: string;
  schedule_name?: string;
  onSuccess?: () => void;
}

const EnableScheduleForm: React.FC<EnableScheduleFormProps> = ({ remote_name, schedule_name, onSuccess }) => {
  const { t } = useTranslation(['schedule', 'common']);
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);

  const { data: scheduleList, isLoading: isScheduleLoading } = useQuery(['getScheduleListOption'], getScheduleList, {
    select: (data) =>
      data?.data?.data?.map((item: { schedule_name: string; full_cron: string }) => {
        return {
          schedule_name: item.schedule_name,
          full_cron: item.full_cron,
        };
      }) || [],
    onError: (error) => {
      message.error(t('schedule:failed_to_fetch_schedule_list') + ': ' + (error as Error).message);
    },
  });

  const { data: remoteList, isLoading: isRemoteLoading } = useQuery(['getRemoteListOption'], getRemoteList, {
    select: (data) => {
      const s3Remotes = data?.data?.s3_remotes?.map((item: { remote_name?: string }) => item.remote_name) || [];
      const linstorRemotes =
        data?.data?.linstor_remotes?.map((item: { remote_name?: string }) => item.remote_name) || [];
      return [...s3Remotes, ...linstorRemotes];
    },
    onError: (error) => {
      message.error(t('schedule:failed_to_fetch_remote_list') + ': ' + (error as Error).message);
    },
  });

  const { data: resourceList, isLoading: isResourceLoading } = useQuery(
    ['getResourceListOption'],
    () => getResources(),
    {
      select: (data) => data?.data?.map((item: { name?: string }) => item.name) || [],
      onError: (error) => {
        message.error(t('schedule:failed_to_fetch_resource_list') + ': ' + (error as Error).message);
      },
    },
  );

  const { data: resourceGroupList, isLoading: isResourceGroupLoading } = useQuery(
    ['getResourceGroupListOption'],
    () => getResourceGroups({}),
    {
      select: (data) => data?.data?.map((item: { name?: string }) => item.name) || [],
      onError: (error) => {
        message.error(t('schedule:failed_to_fetch_resource_group_list') + ': ' + (error as Error).message);
      },
    },
  );

  const { data: nodeList, isLoading: isNodeLoading } = useNodes();

  const mutation = useMutation(
    async (
      values: BackupSchedule & {
        remote_name?: string;
        schedule_name?: string;
      },
    ) => {
      const finalRemoteName = remote_name || values.remote_name!;
      const finalScheduleName = schedule_name || values.schedule_name!;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { remote_name: _, schedule_name: __, ...body } = values;
      return enableSchedule(finalRemoteName, finalScheduleName, body);
    },
    {
      onSuccess: () => {
        form.resetFields();
        message.success(t('schedule:schedule_enabled_successfully'));
        onSuccess?.();
        setVisible(false);
      },
      onError: (error: Error) => {
        message.error(t('schedule:failed_to_enable_schedule') + ': ' + error.message);
      },
    },
  );

  const handleSubmit = (
    values: BackupSchedule & {
      remote_name?: string;
      schedule_name?: string;
    },
  ) => {
    mutation.mutate(values);
  };

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        {t('schedule:enable')}
      </Button>

      <Modal
        title={t('schedule:enable_schedule')}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVisible(false)}>
            {t('common:cancel')}
          </Button>,
          <Button key="submit" type="primary" loading={mutation.isLoading} onClick={() => form.submit()}>
            {t('schedule:enable')}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            remote_name,
            schedule_name,
          }}
        >
          {!remote_name && (
            <Form.Item
              label={t('schedule:remote_name')}
              name="remote_name"
              rules={[{ required: true, message: t('schedule:please_select_remote_name') }]}
            >
              <Select
                placeholder={t('schedule:select_remote_name')}
                loading={isRemoteLoading}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={
                  remoteList?.map((remote) => ({
                    label: remote,
                    value: remote,
                  })) || []
                }
              ></Select>
            </Form.Item>
          )}

          <Form.Item
            label={t('schedule:schedule_name')}
            name="schedule_name"
            rules={[{ required: true, message: t('schedule:please_select_schedule_name') }]}
          >
            <Select
              placeholder={t('schedule:select_schedule_name')}
              loading={isScheduleLoading}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={
                scheduleList?.map((schedule) => ({
                  label: schedule.schedule_name + ' (' + schedule.full_cron + ')',
                  value: schedule.schedule_name,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item label={t('schedule:resource_name')} name="rsc_name">
            <Select
              placeholder={t('schedule:select_resource_name')}
              loading={isResourceLoading}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={
                _.uniqBy(
                  resourceList?.map((resource) => ({
                    label: resource,
                    value: resource,
                  })) || [],
                  'value',
                ).map((item) => ({
                  label: item.label,
                  value: item.value,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item label={t('schedule:resource_group_name')} name="grp_name">
            <Select
              placeholder={t('schedule:select_resource_group_name')}
              loading={isResourceGroupLoading}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={
                resourceGroupList?.map((group) => ({
                  label: group,
                  value: group,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item label={t('schedule:node_name')} name="node_name">
            <Select
              placeholder={t('schedule:select_node_name')}
              loading={isNodeLoading}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={
                nodeList?.map((node) => ({
                  label: node.name,
                  value: node.name,
                })) || []
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EnableScheduleForm;
