// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Select, Space, Checkbox, Alert } from 'antd';
import { Button } from '@app/components/Button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { SizeInput } from '@app/components/SizeInput';
import { createISCSIExport } from '../api';
import { notify } from '@app/utils/toast';

import { useResourceGroups } from '@app/features/resourceGroup';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

type FormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  gross_size?: boolean;
  allowed_ips: string[];
  iqn: string;
  service_ips: string[];
  username?: string;
  password?: string;
};

const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 17, offset: 7 },
  },
};

const CreateISCSIForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();

  const { data: resourceGroupsFromLinstor } = useResourceGroups({ excludeDefault: false });
  const [time, setTime] = useState('');
  const [domain, setDomain] = useState('');
  const { t } = useTranslation(['common', 'iscsi']);

  const backToList = () => {
    navigate('/gateway/iscsi');
  };

  const createMutation = useMutation({
    mutationFn: createISCSIExport,
    onSuccess: () => {
      notify('Create iSCSI Export successfully', {
        type: 'success',
      });
      setTimeout(() => {
        backToList();
      }, 300);
    },
    onError: (err: { code: string; message: string }) => {
      let message = 'Create iSCSI export target failed';
      if (err.message) {
        message = err.message;
      }
      notify(message, {
        type: 'error',
      });
    },
  });

  const onFinish = async (values: FormType) => {
    const iqn = 'iqn.' + time + '.' + domain + ':' + values.iqn;

    const volumes = [
      {
        number: 1,
        size_kib: values.size,
      },
    ];

    const service_ips = [values.service_ip];

    if (values.service_ips) {
      values.service_ips.forEach((ip) => {
        if (ip) {
          service_ips.push(ip);
        }
      });
    }

    const currentExport = {
      iqn,
      service_ips,
      resource_group: values.resource_group || 'DfltRscGrp',
      volumes,
      username: values.username || '',
      password: values.password || '',
      gross_size: values.gross_size || false,
    };

    createMutation.mutate(currentExport);
  };

  return (
    <Form<FormType>
      labelCol={{ span: 7 }}
      wrapperCol={{ span: 17 }}
      style={{ maxWidth: 800 }}
      size="large"
      layout="horizontal"
      form={form}
      onFinish={onFinish}
      initialValues={{
        satellite_port: 3366,
        type: 'Satellite',
        resource_group: 'DfltRscGrp',
        gross_size: false,
      }}
    >
      <Alert
        message="Creates a highly available iSCSI target based on LINSTOR and drbd-reactor."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Form.Item
        label={t('iscsi:iqn')}
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
          <Input addonBefore="." placeholder="com.company" onChange={(e) => setDomain(e.target.value)} />
          <Input addonBefore=":" placeholder="unique-name" />
        </Space.Compact>
      </Form.Item>

      <Form.Item
        label={t('iscsi:resource_group')}
        name="resource_group"
        tooltip="LINSTOR resource group to use (default: DfltRscGrp)"
      >
        <Select
          allowClear
          placeholder="Please select resource group"
          options={resourceGroupsFromLinstor?.map((e) => ({
            label: `${e.name}`,
            value: e.name,
          }))}
        />
      </Form.Item>

      <Form.Item
        label={t('iscsi:service_ips')}
        name="service_ip"
        required
        rules={[
          {
            required: true,
            message: 'IP address is required!',
          },
          {
            message: 'Please input valid IP address and subnet mask, like 192.168.1.1/24, 10.10.1.1/24 ',
            pattern: new RegExp(
              '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(3[0-2]|[1-2]?[0-9])$',
            ),
          },
        ]}
        tooltip="Must be valid IP address, like 192.168.1.1/24, 10.10.1.1/24"
      >
        <Input placeholder="192.168.1.1/24" />
      </Form.Item>

      <Form.List name="service_ips">
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map((field) => (
              <Form.Item {...formItemLayoutWithOutLabel} required={false} key={field.key}>
                <Form.Item
                  {...field}
                  validateTrigger={['onChange', 'onBlur']}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Input valid service ip like 192.168.0.0/16',
                    },
                  ]}
                  noStyle
                >
                  <Input placeholder="192.168.1.1/24" style={{ width: '60%' }} />
                </Form.Item>
                {fields.length > 0 ? (
                  <MinusCircleOutlined
                    className="dynamic-delete-button"
                    style={{
                      marginLeft: 10,
                    }}
                    onClick={() => remove(field.name)}
                  />
                ) : null}
              </Form.Item>
            ))}
            <Form.Item
              wrapperCol={{
                offset: 7,
              }}
            >
              <Button type="dashed" onClick={() => add()} style={{ width: '60%' }}>
                {t('iscsi:add_service_ip')}
                <PlusOutlined />
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item name="size" label={t('common:size')} required>
        <SizeInput />
      </Form.Item>

      <Form.Item
        label="Gross Size"
        name="gross_size"
        valuePropName="checked"
        tooltip="Make all size options specify gross size, i.e. the actual space used on disk"
      >
        <Checkbox />
      </Form.Item>

      <Form.Item label="Username" name="username" tooltip="Set the username to use for CHAP authentication (optional)">
        <Input placeholder="CHAP username" />
      </Form.Item>

      <Form.Item label="Password" name="password" tooltip="Set the password to use for CHAP authentication (optional)">
        <Input.Password placeholder="CHAP password" />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
        <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
          {t('common:submit')}
        </Button>

        <Button type="secondary" onClick={backToList} style={{ marginLeft: '1em' }}>
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateISCSIForm };
