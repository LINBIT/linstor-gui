// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Checkbox, Alert } from 'antd';
import { Button } from '@app/components/Button';
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
  gross_size?: boolean;
  allowed_ips: string[];
  service_ips: string[];
  volumes: {
    size_kib: number;
    export_path: string;
  }[];
};

const CreateNFSForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormType>();
  const { data: resourceGroupsFromLinstor } = useResourceGroups({ excludeDefault: false });
  const { t } = useTranslation(['nfs', 'common']);

  const backToList = () => {
    navigate('/gateway/NFS');
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
        file_system_root_owner: { user: 'nobody', group: 'nobody' },
      },
      ...(values.volumes || []).map((vol, index) => ({
        number: index + 2,
        export_path: vol.export_path,
        size_kib: vol.size_kib,
        file_system: values.file_system,
        file_system_root_owner: { user: 'nobody', group: 'nobody' },
      })),
    ];

    const currentExport = {
      name: values.name,
      service_ip: values.service_ip,
      resource_group: values.resource_group,
      volumes,
      allowed_ips: values.allowed_ips && values.allowed_ips.length > 0 ? values.allowed_ips : ['0.0.0.0/0'],
      gross_size: values.gross_size || false,
    };

    createNFTMutation.mutate(currentExport);
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 7 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 17 },
    },
  };

  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      xs: { span: 24, offset: 0 },
      sm: { span: 17, offset: 7 },
    },
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
        export_path: '/',
        file_system: 'ext4',
        gross_size: false,
        resource_group: 'DfltRscGrp',
      }}
    >
      <Alert
        message="NOTE: Only one NFS resource can exist in a cluster. To create multiple exports, create a single resource with multiple volumes."
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />
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

      <Form.Item
        name="export_path"
        label={t('nfs:export_path')}
        tooltip="Export path relative to /srv/gateway-exports, default is /"
      >
        <Input placeholder="Please input export path: /" />
      </Form.Item>

      <Form.Item label={t('nfs:file_system')} name="file_system" tooltip="File system type to use (default: ext4)">
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

      <Form.Item
        label="Gross Size"
        name="gross_size"
        valuePropName="checked"
        tooltip="Make all size options specify gross size, i.e. the actual space used on disk"
      >
        <Checkbox />
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
                <Form.Item
                  label={t('common:size')}
                  name={[index, 'size_kib']}
                  rules={[{ required: true, message: 'Size is required!' }]}
                >
                  <SizeInput />
                </Form.Item>

                <Form.Item
                  label={t('nfs:export_path')}
                  name={[index, 'export_path']}
                  rules={[{ required: true, message: 'Export path is required!' }]}
                >
                  <Input placeholder="Please input export path: /" />
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
            <Form.Item wrapperCol={{ xs: { span: 24, offset: 0 }, sm: { span: 17, offset: 7 } }}>
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
                label={
                  index === 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{t('nfs:allowed_ips')}</span>
                  ) : (
                    ''
                  )
                }
                required={false}
                key={field.key}
                tooltip="IP address mask of clients that are allowed access (default: 0.0.0.0/0)"
              >
                <Form.Item
                  {...field}
                  validateTrigger={['onChange', 'onBlur']}
                  rules={[
                    {
                      required: false,
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
            <Form.Item wrapperCol={{ xs: { span: 24, offset: 0 }, sm: { span: 17, offset: 7 } }}>
              <Button type="dashed" onClick={() => add()} style={{ width: '60%' }}>
                {t('nfs:allowed_ips')} <PlusOutlined />
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
        <Button type="primary" htmlType="submit" loading={createNFTMutation.isLoading}>
          {t('common:submit')}
        </Button>

        <Button type="secondary" onClick={backToList} style={{ marginLeft: '1em' }}>
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateNFSForm };
