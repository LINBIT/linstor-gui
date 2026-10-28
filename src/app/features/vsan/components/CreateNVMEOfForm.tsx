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
import { createNVMEExport, getResourceGroups } from '../api';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { ErrorMessage } from '@app/features/vsan';

import { NetworkAddress } from '@app/features/gateway/types';
import { Checkbox } from '@app/components/Checkbox';
import { variablesOnly } from '@app/utils/mutation';

interface ResourceGroup {
  name: string;
  max_volume_size: number;
}

type FormType = {
  name: string;
  resource_group: string;
  service_ip_prefix: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  allowed_ips: string[];
  nqn: string;
  gross_size: boolean;
  time: string;
  domain: string;
};

interface IPServiceOption {
  label: string;
  value: string;
  mask: number;
}

type CreateNVMEOfFormProps = {
  refetch?: () => void;
};

const timeRegx = /^((19|20)\d\d[-](0[1-9]|1[012]))$/;
const domainRegx = /^([a-zA-Z\d.][a-zA-Z\d.-]*\.[a-zA-Z\d.][a-zA-Z\d.-]*[a-zA-Z\d])$/;
const nameRegx = /^([a-z_][a-z0-9_-]+)$/;

const CreateNVMEOfForm = ({ refetch }: CreateNVMEOfFormProps) => {
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

  const ipServiceOptions: IPServiceOption[] = React.useMemo(() => {
    return (
      ipPrefixes?.map((e: NetworkAddress) => ({
        label: e.prefix,
        value: e.prefix,
        mask: e.mask,
      })) || []
    );
  }, [ipPrefixes]);

  useEffect(() => {
    let maxVolumeSize = 0;
    const selectedRG = resourceGroupsFromVSAN?.data?.find((e: ResourceGroup) => e.name === resource_group);
    if (selectedRG) {
      maxVolumeSize = selectedRG?.max_volume_size - clusterPrivateVolumeSizeKib;
    }

    if (gross_size) {
      form.setFieldValue('size', maxVolumeSize);
    }
  }, [form, resourceGroupsFromVSAN, resource_group, gross_size]);

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    form.resetFields();
    setCreateFormModal(false);
  };

  const createMutation = useMutation({
    mutationFn: variablesOnly(createNVMEExport),
    onSuccess: () => {
      api.success({
        title: t('vsan:create_nvme_success'),
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
      const nqn = 'nqn.' + values.time + '.' + values.domain + ':nvme:' + values.nqn;

      const volumes = [
        {
          number: 1,
          size_kib: values.size,
        },
      ];

      const currentExport = {
        nqn,
        service_ip: service_ip_str,
        resource_group: values.resource_group,
        volumes,
        gross_size: values.gross_size,
      };

      createMutation.mutate(currentExport);
    } catch (error) {
      logger.debug('Failed:', error);
    }
  };

  return (
    <>
      {contextHolder}
      <Button type="primary" onClick={() => setCreateFormModal(true)}>
        {t('common:create')}
      </Button>

      <Modal
        title={t('common:create')}
        open={createFormModal}
        onCancel={handleCancel}
        width={800}
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
            className="max-w-[800px]"
            size="large"
            layout="vertical"
            form={form}
            onFinish={onFinish}
            initialValues={{
              gross_size: true,
            }}
          >
            <Form.Item label="NQN" required tooltip={t('nvme:nqn_tooltip')}>
              <Space.Compact size="large">
                <Space.Addon>nqn.</Space.Addon>
                <Form.Item
                  name="time"
                  required
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: '',
                    },
                    {
                      pattern: timeRegx,
                      message: '',
                    },
                  ]}
                >
                  <Input placeholder="yyyy-mm" />
                </Form.Item>
                <Space.Addon>.</Space.Addon>
                <Form.Item
                  name="domain"
                  required
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: '',
                    },
                    {
                      pattern: domainRegx,
                      message: '',
                    },
                  ]}
                >
                  <Input placeholder="com.company" />
                </Form.Item>
                <Space.Addon>:nvme:</Space.Addon>
                <Form.Item
                  name="nqn"
                  required
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: '',
                    },
                    {
                      pattern: nameRegx,
                      message: '',
                    },
                  ]}
                >
                  <Input placeholder="unique-name" />
                </Form.Item>
              </Space.Compact>
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
                options={resourceGroupsFromVSAN?.data?.map((e: ResourceGroup) => ({
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

            <Form.Item label={t('common:size')}>
              {/* The size takes the room there is; the checkbox goes below it when there is none. */}
              <div className="flex flex-wrap items-center gap-x-4">
                <Form.Item
                  name="size"
                  className="min-w-[220px] flex-1"
                  rules={[{ required: true, message: t('common:size_required') }]}
                >
                  {gross_size ? <SizeInput disabled={gross_size} /> : <SizeInput />}
                </Form.Item>
                <Form.Item name="gross_size" valuePropName="checked">
                  <Checkbox>{t('vsan:use_all_available')}</Checkbox>
                </Form.Item>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export { CreateNVMEOfForm };
