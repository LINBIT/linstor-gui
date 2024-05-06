import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Select, Space, notification } from 'antd';

import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createISCSIExport, getResourceGroups } from '../api';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { ErrorMessage } from '@app/features/vsan';

import { Content } from './styled';

const timeRegx = /^((19|20)\d\d[-](0[1-9]|1[012]))$/;
const domainRegx = /^([a-zA-Z\d.][a-zA-Z\d.-]*\.[a-zA-Z\d.][a-zA-Z\d.-]*[a-zA-Z\d])$/;
const nameRegx = /^([a-z_][a-z0-9_-]+)$/;

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
  gross_size: boolean;
  time: string;
  domain: string;
};

type CreateISCSIFormProps = {
  refetch?: () => void;
};

const CreateISCSIForm = ({ refetch }: CreateISCSIFormProps) => {
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
      refetch && refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail,
        duration: 0,
      });
    },
  });

  const gross_size = Form.useWatch('gross_size', form);
  const resource_group = Form.useWatch('resource_group', form);

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    form.resetFields();
    setCreateFormModal(false);
  };

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();

      const service_ip_str = prefix + service_ip + '/' + mask;
      const iqn = 'iqn.' + values.time + '.' + values.domain + ':' + values.iqn;

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
        gross_size: values.gross_size,
        // this value is hardcoded in the original
        implementation: 'scst',
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

    if (gross_size) {
      form.setFieldValue('size', maxVolumeSize);
    }
  }, [form, resourceGroupsFromVSAN, resource_group, gross_size]);

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
        <Content>
          <Form<FormType>
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            style={{ maxWidth: 800 }}
            size="large"
            layout="horizontal"
            form={form}
            onFinish={onFinish}
          >
            <Form.Item label="IQN" required>
              <Space.Compact size="large">
                <Form.Item
                  name="time"
                  required
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: 'Year and month are required!',
                    },
                    {
                      pattern: timeRegx,
                      message: 'Invalid year and month, should be yyyy-mm',
                    },
                  ]}
                >
                  <Input addonBefore="iqn." placeholder="yyyy-mm" />
                </Form.Item>
                <Form.Item
                  name="domain"
                  required
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: 'Naming-authority is required!',
                    },
                    {
                      pattern: domainRegx,
                      message: 'Invalid naming-authority, should be com.company',
                    },
                  ]}
                >
                  <Input addonBefore="." placeholder="com.company" />
                </Form.Item>
                <Form.Item
                  name="iqn"
                  required
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: 'Unique name is required!',
                    },
                    {
                      pattern: nameRegx,
                      message: 'Invalid unique name',
                    },
                  ]}
                >
                  <Input addonBefore=":" placeholder="unique-name" />
                </Form.Item>
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
                  {gross_size ? <SizeInput disabled={gross_size} /> : <SizeInput />}
                </Form.Item>
                <Form.Item name="gross_size" valuePropName="checked">
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
        </Content>
      </Modal>
    </>
  );
};

export { CreateISCSIForm };
