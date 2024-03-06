import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Select, Space } from 'antd';
import { useHistory } from 'react-router-dom';

import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createNVMEExport, getResourceGroups } from '../api';
import { notify } from '@app/utils/toast';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';
import { useResourceGroups } from '@app/features/resourceGroup';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';

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
  const history = useHistory();
  const [form] = Form.useForm<FormType>();
  const { data: ipPrefixes } = useNodeNetWorkInterface();
  const { data: resourceGroupsFromLinstor } = useResourceGroups({ excludeDefault: true });
  const [mask, setMask] = useState(0);
  const [prefix, setPrefix] = useState();
  const [time, setTime] = useState('');
  const [domain, setDomain] = useState('');

  const { data: resourceGroupsFromVSAN } = useQuery({
    queryKey: ['getResourceGroupDataFromVSAN'],
    queryFn: () => getResourceGroups(),
  });

  const { vsanMode } = useSelector((state: RootState) => ({
    vsanMode: state.setting.KVS?.vsanMode,
  }));

  const service_ip = Form.useWatch('service_ip', form);
  const use_all = Form.useWatch('use_all', form);
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

    if (use_all) {
      form.setFieldValue('size', maxVolumeSize);
    }
  }, [form, resourceGroupsFromVSAN, resource_group, use_all]);

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
    onError: (err) => {
      console.log(err);
      notify('Create NVMe-oF Export failed', {
        type: 'error',
      });
    },
  });

  const onFinish = async (values: FormType) => {
    console.log(values, 'values');
    const service_ip_str = prefix + service_ip + '/' + mask;
    const nqn = 'nqn.' + time + '.' + domain + ':nvme:' + values.nqn;

    const volumes = [
      {
        number: 1,
        size_kib: values.size,
      },
    ];

    const currentExport = {
      nqn,
      service_ip: vsanMode ? service_ip_str : values.service_ip,
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
        label="NQN"
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
        label="Resource Group"
        name="resource_group"
        required
        rules={[{ required: true, message: 'Please select resource group!' }]}
      >
        {vsanMode ? (
          <Select
            allowClear
            placeholder="Please select resource group"
            options={resourceGroupsFromVSAN?.data?.map((e) => ({
              label: `${e.name} (${formatBytes(e.max_volume_size)} available)`,
              value: e.name,
            }))}
          />
        ) : (
          <Select
            allowClear
            placeholder="Please select resource group"
            options={resourceGroupsFromLinstor?.map((e) => ({
              label: `${e.name}`,
              value: e.name,
            }))}
          />
        )}
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
        tooltip="This is the IP address under which the NVMe-oF target will be reachable. This must be an address within one of the hosts subnets.
        The service IP is a newly assigned address and should not already belong to a host."
      >
        {vsanMode ? (
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
        ) : (
          <Input placeholder="192.168.1.1/24" />
        )}
      </Form.Item>

      <Form.Item name="size" label="Size" required>
        {use_all ? <SizeInput disabled={use_all} /> : <SizeInput />}
      </Form.Item>

      {vsanMode && (
        <Form.Item name="use_all" valuePropName="checked" wrapperCol={{ offset: 6, span: 16 }}>
          <Checkbox>Use all available</Checkbox>
        </Form.Item>
      )}

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
          Submit
        </Button>

        <Button type="text" onClick={backToList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateNVMEOfForm };
