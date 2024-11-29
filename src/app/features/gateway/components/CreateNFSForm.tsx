// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { Button, Form, Input, Select } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { useResourceGroups } from '@app/features/resourceGroup';
import { SizeInput } from '@app/components/SizeInput';
import { notify } from '@app/utils/toast';
import { createNFSExport } from '../api';

type FormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size_kib: number;
  allowed_ips: string[];
  service_ips: string[];
  volumes: {
    size_kib: number;
    export_path: string;
    file_system: string;
  }[];
};

const CreateNFSForm = () => {
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const { data: resourceGroupsFromLinstor } = useResourceGroups({ excludeDefault: true });
  const { t } = useTranslation(['nfs', 'common']);

  const backToList = () => {
    history.push('/gateway/NFS');
  };

  const createNFTMutation = useMutation({
    mutationFn: createNFSExport,
    onSuccess: () => {
      notify('Create NFS Export successfully', {
        type: 'success',
      });
      setTimeout(() => {
        backToList();
      }, 300);
    },
    onError: (err: { code: string; message: string }) => {
      console.log(err);
      let message = 'Create NFS Export failed';
      if (err.message) {
        message = err.message;
      }
      notify(message, {
        type: 'error',
      });
    },
  });

  const onFinish = async (values: FormType) => {
    const volumes = [
      {
        number: 1,
        export_path: values.export_path,
        size_kib: values.size_kib,
        file_system: values.file_system,
      },
      ...(values.volumes || []).map((vol, index) => ({
        number: index + 2,
        export_path: vol.export_path,
        size_kib: vol.size_kib,
        file_system: vol.file_system,
      })),
    ];

    const currentExport = {
      name: values.name,
      service_ip: values.service_ip,
      resource_group: values.resource_group,
      volumes,
      allowed_ips: values.allowed_ips || [],
      gross_size: false,
    };

    createNFTMutation.mutate(currentExport);
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
      style={{ maxWidth: 500 }}
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
        label={t('common:name')}
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
        label={t('common:resource_group')}
        name="resource_group"
        required
        rules={[{ required: true, message: 'Please select resource group!' }]}
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
        label={t('nfs:service_ip')}
        name="service_ip"
        required
        rules={[
          {
            required: true,
            message: 'Service IP is required!',
          },
          {
            message: 'Please input valid IP address and subnet mask, like 192.168.1.1/24, 10.10.1.1/24 ',
            pattern: new RegExp(
              '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(3[0-2]|[1-2]?[0-9])$',
            ),
          },
        ]}
        tooltip="Must be valid service IP address, like 192.168.1.1/24, 10.10.1.1/24"
      >
        <Input placeholder="192.168.1.1/24" />
      </Form.Item>

      <Form.Item name="size_kib" label={t('common:size')} required>
        <SizeInput />
      </Form.Item>

      <Form.Item name="export_path" label={t('nfs:export_path')} required>
        <Input placeholder="Please input export path: /" />
      </Form.Item>

      <Form.Item
        label={t('nfs:file_system')}
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
            {
              label: 'xfs',
              value: 'xfs',
            },
          ]}
        />
      </Form.Item>

      <Form.List name="volumes">
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map((field, index) => (
              <Form.Item
                {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                label={index === 0 ? t('nfs:volumes') : ''}
                required={false}
                key={field.key}
              >
                <Form.Item label={t('common:size')} name={[index, 'size_kib']}>
                  <SizeInput />
                </Form.Item>

                <Form.Item label={t('nfs:export_path')} name={[index, 'export_path']}>
                  <Input placeholder="Please input export path: /" />
                </Form.Item>

                <Form.Item label={t('nfs:file_system')} name={[index, 'file_system']}>
                  <Select
                    options={[
                      {
                        label: 'ext4',
                        value: 'ext4',
                      },
                      {
                        label: 'xfs',
                        value: 'xfs',
                      },
                    ]}
                  />
                </Form.Item>

                {fields.length > 0 ? (
                  <Button
                    danger
                    style={{
                      marginLeft: 10,
                      marginTop: 10,
                    }}
                    onClick={() => remove(field.name)}
                  >
                    {t('common:delete')}
                  </Button>
                ) : null}
              </Form.Item>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} style={{ width: '60%' }}>
                {t('nfs:volumes')} <PlusOutlined />
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.List name="allowed_ips">
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map((field, index) => (
              <Form.Item
                {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                label={index === 0 ? t('nfs:allowed_ips') : ''}
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
                    {
                      message: 'Please input valid IP address and subnet mask, like 192.168.1.1/24, 10.10.1.1/24 ',
                      pattern: new RegExp(
                        '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(3[0-2]|[1-2]?[0-9])$',
                      ),
                    },
                  ]}
                  noStyle
                >
                  <Input placeholder="192.168.0.0/16" style={{ width: '80%' }} />
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
            <Form.Item>
              <Button type="dashed" onClick={() => add()} style={{ width: '60%' }}>
                {t('nfs:allowed_ips')} <PlusOutlined />
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit" loading={createNFTMutation.isLoading}>
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={backToList}>
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateNFSForm };
