// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@app/utils/logger';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Form, Modal, Space, notification } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';

import { Button } from '@app/components/Button';
import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createNFSExport, getResourceGroups } from '../api';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { ErrorMessage } from '../types';

import { NetworkAddress } from '../types';
import { Checkbox } from '@app/components/Checkbox';
import { variablesOnly } from '@app/utils/mutation';

type FormType = {
  name: string;
  resource_group: string;
  service_ip_prefix: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size_kib: number;
  allowed_ips: string[];
  gross_size: boolean;
  time: string;
  domain: string;
  volumes: {
    size_kib: number;
    export_path: string;
    file_system: string;
  }[];
};

type CreateNFSFormProps = {
  disabled?: boolean;
  refetch?: () => void;
};

const CreateNFSForm = ({ refetch, disabled }: CreateNFSFormProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormType>();
  const [api, contextHolder] = notification.useNotification();
  const { data: ipPrefixes } = useNodeNetWorkInterface();
  const [createFormModal, setCreateFormModal] = useState(false);

  const { data: resourceGroupsFromVSAN } = useQuery({
    queryKey: ['getResourceGroupDataFromVSAN'],
    queryFn: () => getResourceGroups(),
  });

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
      form.setFieldValue('size_kib', maxVolumeSize);
    }
  }, [form, resourceGroupsFromVSAN, resource_group, gross_size]);

  const createMutation = useMutation({
    mutationFn: variablesOnly(createNFSExport),
    onSuccess: () => {
      api.success({
        title: t('vsan:create_nfs_success'),
      });

      setCreateFormModal(false);

      if (refetch) {
        refetch();
      }
    },
    onError: (err: ErrorMessage) => {
      api.error({
        title: err?.message,
        description: err?.detail || err?.explanation,
        duration: 0,
      });
    },
  });

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();
      const mask = ipPrefixes?.find((e: NetworkAddress) => e.prefix === values.service_ip_prefix)?.mask ?? 0;
      const service_ip_str = values.service_ip_prefix + values.service_ip + '/' + mask;

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
        service_ip: service_ip_str,
        resource_group: values.resource_group,
        volumes,
        allowed_ips: values.allowed_ips || [],
        gross_size: values.gross_size,
      };

      createMutation.mutate(currentExport);
    } catch (error) {
      logger.debug('Failed:', error);
    }
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
      <Button type="primary" onClick={() => setCreateFormModal(true)} disabled={disabled}>
        {t('common:create')}
      </Button>

      <Modal
        title={t('common:create')}
        open={createFormModal}
        onCancel={handleCancel}
        width={800}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' },
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="secondary" onClick={handleCancel}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={handleOk} loading={createMutation.isPending}>
              {t('common:create')}
            </Button>
          </div>
        }
      >
        <div className="[&_.ant-form-item-explain]:flex [&_.ant-form-item-explain]:justify-between">
          <Form<FormType>
            size="large"
            layout="vertical"
            form={form}
            onFinish={onFinish}
            initialValues={{
              file_system: 'ext4',
            }}
          >
            <Form.Item
              label={t('common:name')}
              name="name"
              required
              rules={[
                {
                  required: true,
                  message: t('common:name_required'),
                },
              ]}
            >
              <Input placeholder={t('common:please_input_name_my_export')} />
            </Form.Item>
            <Form.Item
              label={t('common:resource_group')}
              name="resource_group"
              required
              rules={[{ required: true, message: t('common:resource_group_required') }]}
            >
              <Select
                allowClear
                placeholder={t('iscsi:please_select_resource_group')}
                options={resourceGroupsFromVSAN?.data?.map((e) => ({
                  label: `${e.name} (${formatBytes(e.max_volume_size)} available)`,
                  value: e.name,
                }))}
              />
            </Form.Item>

            <Form.Item label={t('iscsi:service_ips')} required tooltip={t('vsan:service_ip_tooltip')}>
              <Space>
                <Form.Item
                  name="service_ip_prefix"
                  noStyle
                  rules={[{ required: true, message: t('common:ip_prefix_required') }]}
                >
                  <Select options={ipServiceOptions} className="min-w-[140px]" placeholder="192.168.1." />
                </Form.Item>
                <Form.Item name="service_ip" noStyle rules={[{ required: true, message: t('common:ip_required') }]}>
                  <Input placeholder="0" />
                </Form.Item>
              </Space>
            </Form.Item>

            <Form.Item label={t('common:size')} required>
              {/* The size takes the room there is; the checkbox goes below it when there is none. */}
              <div className="flex flex-wrap items-center gap-x-4">
                <Form.Item
                  name="size_kib"
                  className="min-w-[220px] flex-1"
                  rules={[{ required: true, message: t('common:size_required') }]}
                >
                  <SizeInput disabled={gross_size} />
                </Form.Item>
                <Form.Item name="gross_size" valuePropName="checked">
                  <Checkbox>{t('vsan:use_all_available')}</Checkbox>
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item
              name="export_path"
              label={t('nfs:export_path')}
              rules={[{ required: true, message: t('common:export_path_required') }]}
            >
              <Input placeholder="/" />
            </Form.Item>

            <Form.Item
              label={t('nfs:file_system')}
              name="file_system"
              required
              rules={[
                {
                  required: true,
                  message: t('common:file_system_required'),
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
                    <Form.Item label={index === 0 ? 'Additional Volumes' : ''} required={false} key={field.key}>
                      <Form.Item label={t('common:size')} name={[index, 'size_kib']}>
                        <SizeInput />
                      </Form.Item>

                      <Form.Item label={t('nfs:export_path')} name={[index, 'export_path']}>
                        <Input placeholder={t('common:please_input_export_path')} />
                      </Form.Item>

                      <Form.Item label={t('nfs:file_system')} name={[index, 'file_system']}>
                        <Select
                          options={[
                            {
                              label: 'ext4',
                              value: 'ext4',
                            },
                          ]}
                        />
                      </Form.Item>

                      {fields.length > 0 ? (
                        <Button danger className="ml-2.5 mt-2.5" onClick={() => remove(field.name)}>
                          {t('common:delete')}
                        </Button>
                      ) : null}
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} className="w-3/5">
                      Volumes <PlusOutlined />
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.List name="allowed_ips">
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(({ key, ...field }, index) => (
                    <Form.Item label={index === 0 ? 'Allowed IPs' : ''} required={false} key={key}>
                      <Form.Item
                        {...field}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: t('common:cidr_example'),
                          },
                        ]}
                        noStyle
                      >
                        <Input placeholder="192.168.0.0/16" className="w-3/5" />
                      </Form.Item>
                      {fields.length > 0 ? (
                        <MinusCircleOutlined
                          className="dynamic-delete-button ml-2.5"
                          onClick={() => remove(field.name)}
                        />
                      ) : null}
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} className="w-3/5">
                      Allowed IPs <PlusOutlined />
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export { CreateNFSForm };
