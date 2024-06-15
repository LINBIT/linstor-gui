import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Select, Space, notification } from 'antd';

import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createNFSExport, getResourceGroups } from '../api';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { ErrorMessage } from '../types';
import { Content } from './styled';

type FormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  allowed_ips: string[];
  gross_size: boolean;
  time: string;
  domain: string;
};

type CreateNFSFormProps = {
  refetch?: () => void;
};

const CreateNFSForm = ({ refetch }: CreateNFSFormProps) => {
  const [form] = Form.useForm<FormType>();
  const [api, contextHolder] = notification.useNotification();
  const { data: ipPrefixes } = useNodeNetWorkInterface();
  const [createFormModal, setCreateFormModal] = useState(false);

  const { data: resourceGroupsFromVSAN } = useQuery({
    queryKey: ['getResourceGroupDataFromVSAN'],
    queryFn: () => getResourceGroups(),
  });
  const [mask, setMask] = useState(0);
  const [prefix, setPrefix] = useState();

  const service_ip = Form.useWatch('service_ip', form);
  const gross_size = Form.useWatch('gross_size', form);
  const resource_group = Form.useWatch('resource_group', form);

  const ipServiceOptions = React.useMemo(() => {
    return ipPrefixes?.map((e) => ({
      label: e.prefix,
      value: e.prefix,
      mask: e.mask,
    }));
  }, [ipPrefixes]);

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

  const createMutation = useMutation({
    mutationFn: createNFSExport,
    onSuccess: () => {
      api.success({
        message: 'Create NFS Export successfully',
      });

      setCreateFormModal(false);

      refetch && refetch();
    },
    onError: (err: ErrorMessage) => {
      api.error({
        message: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();
      const service_ip_str = prefix + service_ip + '/' + mask;

      const volumes = [
        {
          number: 1,
          export_path: `${values.export_path}`,
          size_kib: values.size,
          file_system: values.file_system,
        },
      ];

      const currentExport = {
        name: values.name,
        service_ip: service_ip_str,
        resource_group: values.resource_group,
        volumes,
        allowed_ips: values.allowed_ips || [],
        gross_size: values.gross_size,
      };

      createMutation.mutate(currentExport);
    } catch (error) {
      console.log('Failed:', error);
    }
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 6 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 20 },
    },
  };

  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      xs: { span: 24, offset: 0 },
      sm: { span: 18, offset: 6 },
    },
  };

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    form.resetFields();
    setCreateFormModal(false);
  };

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
            size="large"
            layout="horizontal"
            form={form}
            onFinish={onFinish}
            initialValues={{
              file_system: 'ext4',
            }}
          >
            <Form.Item
              label="Name"
              name="name"
              required
              rules={[
                {
                  required: true,
                  message: 'Name is required!',
                },
              ]}
            >
              <Input placeholder="Please input name: my_export" />
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
                  // defaultValue={ipServiceOptions?.[0]?.value ?? ''}
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

            <Form.Item name="export_path" label="Export Path" required>
              <Input placeholder="/" />
            </Form.Item>

            <Form.Item
              label="File System"
              name="file_system"
              required
              rules={[
                {
                  required: true,
                  message: 'File system is required!',
                },
              ]}
            >
              <Select
                options={[
                  {
                    label: 'ext4',
                    value: 'ext4',
                  },
                ]}
              />
            </Form.Item>

            <Form.List name="allowed_ips">
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                      label={index === 0 ? 'Allowed IPs' : ''}
                      required={false}
                      key={field.key}
                    >
                      <Form.Item
                        {...field}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: 'Please input something like 192.168.0.0/16',
                          },
                        ]}
                        noStyle
                      >
                        <Input placeholder="192.168.0.0/16" style={{ width: '60%' }} />
                      </Form.Item>
                      {fields.length > 0 ? (
                        <MinusCircleOutlined
                          className="dynamic-delete-button"
                          onClick={() => remove(field.name)}
                          rev={undefined}
                        />
                      ) : null}
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} style={{ width: '60%' }}>
                      Allowed IPs <PlusOutlined rev={undefined} />
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </Content>
      </Modal>
    </>
  );
};

export { CreateNFSForm };
