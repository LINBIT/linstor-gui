// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input, Select, Space } from 'antd';
import { useHistory } from 'react-router-dom';

import { notify } from '@app/utils/toast';
import { SizeInput } from '@app/components/SizeInput';
import { useResourceGroups } from '@app/features/resourceGroup';

import { createNVMEExport } from '../api';
import { useTranslation } from 'react-i18next';

type FormType = {
  name: string;
  resource_group: string;
  service_ip: string;
  export_path: string;
  file_system: string;
  size: number;
  allowed_ips: string[];
  nqn: string;
};

const CreateNVMEOfForm = () => {
  const { t } = useTranslation(['common', 'nvme']);
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const { data: resourceGroupsFromLinstor } = useResourceGroups({ excludeDefault: true });

  const [time, setTime] = useState('');
  const [domain, setDomain] = useState('');

  const backToList = () => {
    history.push('/gateway/nvme-of');
  };

  const createMutation = useMutation({
    mutationFn: createNVMEExport,
    onSuccess: () => {
      notify('Create NVMe-oF Export successfully', {
        type: 'success',
      });
      setTimeout(() => {
        backToList();
      }, 300);
    },
    onError: (err: { code: string; message: string }) => {
      let message = 'Create NVMe-oF Export failed';
      if (err.message) {
        message = err.message;
      }
      notify(message, {
        type: 'error',
      });
    },
  });

  const onFinish = async (values: FormType) => {
    const nqn = 'nqn.' + time + '.' + domain + ':nvme:' + values.nqn;

    const volumes = [
      {
        number: 1,
        size_kib: values.size,
      },
    ];

    const currentExport = {
      nqn,
      service_ip: values.service_ip,
      resource_group: values.resource_group,
      volumes,
      gross_size: false,
    };

    createMutation.mutate(currentExport);
  };

  return (
    <Form<FormType>
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ maxWidth: 800 }}
      size="large"
      layout="horizontal"
      form={form}
      onFinish={onFinish}
      initialValues={{
        use_all: true,
      }}
    >
      <Form.Item
        label={t('nvme:nqn')}
        name="nqn"
        required
        rules={[
          {
            required: true,
            message: 'NQN is required!',
          },
        ]}
        tooltip="The NQN uniquely identifies a NVMe-oF target.
        Fill out your company's domain name and choose a unique name within that domain. Your initiator will then be able to identify the target using this NQN.

        Example: nqn.2020-01.com.linbit:nvme:vmstorage"
      >
        <Space.Compact size="large">
          <Input addonBefore="nqn." placeholder="yyyy-mm" onChange={(e) => setTime(e.target.value)} />
          <Input addonBefore="." placeholder="com.company" onChange={(e) => setDomain(e.target.value)} />
          <Input addonBefore=":nvme:" placeholder="unique-name" />
        </Space.Compact>
      </Form.Item>
      <Form.Item
        label={t('nvme:resource_group')}
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
        label={t('nvme:service_ip')}
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
        tooltip="This is the IP address under which the NVMe-oF target will be reachable. This must be an address within one of the hosts subnets.
        The service IP is a newly assigned address and should not already belong to a host."
      >
        <Input placeholder="192.168.1.1/24" />
      </Form.Item>

      <Form.Item name="size" label={t('common:size')} required>
        <SizeInput />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
          {t('common:submit')}
        </Button>

        <Button type="text" onClick={backToList}>
          {t('common:cancel')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateNVMEOfForm };
