import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);

  const { data: scheduleList, isLoading: isScheduleLoading } = useQuery(['getScheduleListOption'], getScheduleList, {
    select: (data) => data?.data?.data?.map((item: { schedule_name: string }) => item.schedule_name) || [],
    onError: (error) => {
      message.error('Failed to fetch schedule list: ' + (error as any).message);
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
      message.error('Failed to fetch remote list: ' + (error as any).message);
    },
  });

  const { data: resourceList, isLoading: isResourceLoading } = useQuery(
    ['getResourceListOption'],
    () => getResources(),
    {
      select: (data) => data?.data?.map((item: { name?: string }) => item.name) || [],
      onError: (error) => {
        message.error('Failed to fetch resource list: ' + (error as any).message);
      },
    },
  );

  const { data: resourceGroupList, isLoading: isResourceGroupLoading } = useQuery(
    ['getResourceGroupListOption'],
    () => getResourceGroups({}),
    {
      select: (data) => data?.data?.map((item: { name?: string }) => item.name) || [],
      onError: (error) => {
        message.error('Failed to fetch resource group list: ' + (error as any).message);
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
      const { remote_name: _, schedule_name: __, ...body } = values;
      return enableSchedule(finalRemoteName, finalScheduleName, body);
    },
    {
      onSuccess: () => {
        form.resetFields();
        message.success('Schedule enabled successfully!');
        onSuccess?.();
        setVisible(false);
      },
      onError: (error: any) => {
        message.error('Failed to enable schedule: ' + error.message);
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

  console.log(remoteList, scheduleList);

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        Enable
      </Button>

      <Modal
        title="Enable Schedule"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={mutation.isLoading} onClick={() => form.submit()}>
            Enable
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
              label="Remote Name"
              name="remote_name"
              rules={[{ required: true, message: 'Please select the remote name!' }]}
            >
              <Select
                placeholder="Select remote name"
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
            label="Schedule Name"
            name="schedule_name"
            rules={[{ required: true, message: 'Please select the schedule name!' }]}
          >
            <Select
              placeholder="Select schedule name"
              loading={isScheduleLoading}
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={
                scheduleList?.map((schedule) => ({
                  label: schedule,
                  value: schedule,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item label="Resource Name" name="rsc_name">
            <Select
              placeholder="Select resource name"
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

          <Form.Item label="Resource Group Name" name="grp_name">
            <Select
              placeholder="Select resource group name"
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

          <Form.Item label="Node Name" name="node_name">
            <Select
              placeholder="Select node name"
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
