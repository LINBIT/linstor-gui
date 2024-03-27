import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Select, Space, notification } from 'antd';

import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createISCSIExport, getResourceGroups } from '../api';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { ErrorMessage } from '@app/features/vsan';

type FormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  allowed_ips: string[];
  iqn: string;
  enable_chap?: boolean;
  username?: string;
  password?: string;
};

const CreateISCSIForm = () => {
  const [createFormModal, setCreateFormModal] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const [form] = Form.useForm<FormType>();
  const { data: ipPrefixes } = useNodeNetWorkInterface();
  const { data: resourceGroupsFromVSAN } = useQuery({
    queryKey: ['getResourceGroupDataFromVSAN'],
    queryFn: () => getResourceGroups(),
  });
  const [mask, setMask] = useState(0);
  const [prefix, setPrefix] = useState();
  const [time, setTime] = useState('');
  const [domain, setDomain] = useState('');

  const service_ip = Form.useWatch('service_ip', form);
  const enable_chap = Form.useWatch('enable_chap', form);

  const ipServiceOptions = React.useMemo(() => {
    return ipPrefixes?.map((e) => ({
      label: e.prefix,
      value: e.prefix,
      mask: e.mask,
    }));
  }, [ipPrefixes]);

  const createMutation = useMutation({
    mutationFn: createISCSIExport,
    onSuccess: () => {
      api.success({
        message: 'Create iSCSI Export successfully',
      });

      setCreateFormModal(false);
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail,
        duration: 0,
      });
    },
  });

  const use_all = Form.useWatch('use_all', form);
  const resource_group = Form.useWatch('resource_group', form);

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    form.resetFields();
    setTime('');
    setDomain('');
    setCreateFormModal(false);
  };

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();

      const timeRegx = /^((19|20)\d\d[-](0[1-9]|1[012]))$/;
      const domainRegx = /^([a-zA-Z\d.][a-zA-Z\d.-]*\.[a-zA-Z\d.][a-zA-Z\d.-]*[a-zA-Z\d])$/;
      const nameRegx = /^([a-z_][a-z0-9_-]+)$/;
      if (!timeRegx.test(time)) {
        api.error({
          message: 'Invalid time',
          description: 'Please input valid time something like: 2024-03',
          duration: 0,
        });
        return;
      }

      if (!domainRegx.test(domain)) {
        api.error({
          message: 'Invalid domain',
          description: 'Please input valid domain something like: com.company',
          duration: 0,
        });
        return;
      }

      if (!nameRegx.test(values.iqn)) {
        api.error({
          message: 'Invalid IQN',
          description: 'Please input valid IQN something like: unique-name',
          duration: 0,
        });
        return;
      }

      const service_ip_str = prefix + service_ip + '/' + mask;
      const iqn = 'iqn.' + time + '.' + domain + ':' + values.iqn;

      const volumes = [
        {
          number: 1,
          size_kib: values.size,
        },
      ];

      const currentExport = {
        iqn,
        service_ips: [service_ip_str],
        resource_group: values.resource_group,
        volumes,
        username: values.enable_chap ? values.username : '',
        password: values.enable_chap ? values.password : '',
      };

      createMutation.mutate(currentExport);
    } catch (error) {
      console.log('Failed:', error);
    }
  };

  useEffect(() => {
    let maxVolumeSize = 0;
    const selectedRG = resourceGroupsFromVSAN?.data?.find((e) => e.name === resource_group);
    if (selectedRG) {
      maxVolumeSize = selectedRG?.max_volume_size - clusterPrivateVolumeSizeKib;
    }

    if (use_all) {
      form.setFieldValue('size', maxVolumeSize);
    }
  }, [form, resourceGroupsFromVSAN, resource_group, use_all]);

  return (
    <>
      {contextHolder}
      <Button type="primary" onClick={() => setCreateFormModal(true)}>
        Create
      </Button>

      <Modal
        title="Create"
        open={createFormModal}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Create"
        width={800}
        okButtonProps={{
          loading: createMutation.isLoading,
        }}
      >
        <Form<FormType>
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          style={{ maxWidth: 800 }}
          size="large"
          layout="horizontal"
          form={form}
          onFinish={onFinish}
        >
          <Form.Item
            label="IQN"
            name="iqn"
            required
            rules={[
              {
                required: true,
                message: 'IQN is required!',
              },
            ]}
          >
            <Space.Compact size="large">
              <Input addonBefore="iqn." placeholder="yyyy-mm" value={time} onChange={(e) => setTime(e.target.value)} />
              <Input
                addonBefore="."
                placeholder="com.company"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <Input addonBefore=":" placeholder="unique-name" />
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="Resource Group"
            name="resource_group"
            required
            rules={[{ required: true, message: 'Please select resource group!' }]}
          >
            <Select
              allowClear
              placeholder="Please select resource group"
              options={resourceGroupsFromVSAN?.data?.map((e) => ({
                label: `${e.name} (${formatBytes(e.max_volume_size)} available)`,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Service IP"
            name="service_ip"
            required
            rules={[
              {
                required: true,
                message: 'IP address is required!',
              },
            ]}
            tooltip="This is the IP address under which the iSCSI target will be reachable. This must be an address within one of the hosts subnets.
            The service IP is a newly assigned address and should not already belong to a host."
          >
            <Space>
              <Select
                options={ipServiceOptions}
                onChange={(val, option) => {
                  setPrefix(val);
                  setMask((option as any)?.mask as number);
                }}
                style={{ minWidth: 140 }}
                placeholder="192.168.1."
              />
              <Input placeholder="0" />
            </Space>
          </Form.Item>

          <Form.Item label="Size">
            <Space>
              <Form.Item name="size" required>
                {use_all ? <SizeInput disabled={use_all} /> : <SizeInput />}
              </Form.Item>
              <Form.Item name="use_all" valuePropName="checked">
                <Checkbox>Use all available</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name="enable_chap" valuePropName="checked" wrapperCol={{ span: 12, offset: 6 }}>
            <Checkbox>Enable CHAP Authentication</Checkbox>
          </Form.Item>

          {enable_chap && (
            <>
              <Form.Item
                name="username"
                label="Username"
                tooltip="Configure mutual CHAP authentication to restrict access to the iSCSI target by supplying a username and password here."
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                tooltip="Configure mutual CHAP authentication to restrict access to the iSCSI target by supplying a username and password here"
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

export { CreateISCSIForm };
