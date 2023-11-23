import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input, Select, Space } from 'antd';
import { useHistory } from 'react-router-dom';

import { useNodeNetWorkInterface } from '../hooks';
import { useResourceGroups } from '@app/features/resourceGroup';
import { SizeInput } from '@app/components/SizeInput';
import { createNFSExport, createiSCSIExport } from '../api';
import { notify } from '@app/utils/toast';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

type FormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  allowed_ips: string[];
  iqn: string;
};

const CreateISCSIForm = () => {
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const { data: ipPrefixes } = useNodeNetWorkInterface();
  const { data: resourceGroups } = useResourceGroups();
  const [mask, setMask] = useState(0);
  const [prefix, setPrefix] = useState();
  const [time, setTime] = useState('');
  const [domain, setDomain] = useState('');

  const service_ip = Form.useWatch('service_ip', form);

  const ipServiceOptions = React.useMemo(() => {
    return ipPrefixes?.map((e) => ({
      label: e.prefix,
      value: e.prefix,
      mask: e.mask,
    }));
  }, [ipPrefixes]);

  const backToList = () => {
    history.push('/gateway/iscsi');
  };

  const createMutation = useMutation({
    mutationFn: createiSCSIExport,
    onSuccess: () => {
      notify('Create iSCSI Export successfully', {
        type: 'success',
      });
      setTimeout(() => {
        backToList();
      }, 300);
    },
    onError: (err) => {
      console.log(err);
      notify('Create iSCSI Export failed', {
        type: 'error',
      });
    },
  });

  const onFinish = async (values: FormType) => {
    console.log(values, 'values');
    const service_ip_str = prefix + service_ip + '/' + mask;
    const iqn = 'iqn.' + time + '.' + domain + ':' + values.iqn;

    const volumes = [
      {
        number: 1,
        export_path: values.export_path,
        size_kib: values.size,
        file_system: values.file_system,
      },
    ];

    const currentExport = {
      iqn,
      service_ips: [service_ip_str],
      resource_group: values.resource_group,
      volumes,
      allowed_ips: values.allowed_ips || [],
    };

    createMutation.mutate(currentExport);
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

  return (
    <Form<FormType>
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 700 }}
      size="large"
      layout="horizontal"
      form={form}
      onFinish={onFinish}
      initialValues={{
        satellite_port: 3366,
        type: 'Satellite',
      }}
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
          <Input addonBefore="iqn." placeholder="yyyy-mm" onChange={(e) => setTime(e.target.value)} />
          <Input addonBefore="." placeholder="example.com" onChange={(e) => setDomain(e.target.value)} />
          <Input addonBefore=":" placeholder="identifier" />
        </Space.Compact>
      </Form.Item>

      <Form.Item
        label="Resource Group"
        name="resource_group_name"
        required
        rules={[{ required: true, message: 'Please select resource group!' }]}
      >
        <Select
          allowClear
          placeholder="Please select resource group"
          options={resourceGroups?.map((e) => ({
            label: e.name,
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
        tooltip="Must be valid IP address, like 192.168.1.1, 10.10.1.1"
      >
        <Space.Compact>
          <Select
            options={ipServiceOptions}
            onChange={(val, option) => {
              setPrefix(val);
              setMask((option as any)?.mask as number);
            }}
          />
          <Input placeholder="0.0" />
        </Space.Compact>
      </Form.Item>

      <Form.Item name="size" label="Size" required>
        <SizeInput />
      </Form.Item>

      <Form.Item name="export_path" label="Export Path" required>
        <Input placeholder="Please input export path" />
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
                label={index === 0 ? 'Allowed Ips' : ''}
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

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>

        <Button type="text" onClick={backToList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateISCSIForm };
