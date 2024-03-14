import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Select, Space } from 'antd';
import { useHistory } from 'react-router-dom';

import { useNodeNetWorkInterface } from '../hooks';
import { SizeInput } from '@app/components/SizeInput';
import { createISCSIExport, getResourceGroups } from '../api';
import { notify } from '@app/utils/toast';
import { formatBytes } from '@app/utils/size';
import { clusterPrivateVolumeSizeKib } from '../const';

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
  const [createFormModal, setCreateFormModal] = useState(false);

  const [form] = Form.useForm<FormType>();
  const { data: ipPrefixes } = useNodeNetWorkInterface();
  const { data: resourceGroupsFromVSAN } = useQuery({
    queryKey: ['getResourceGroupDataFromVSAN'],
    queryFn: () => getResourceGroups(),
  });
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

  const createMutation = useMutation({
    mutationFn: createISCSIExport,
    onSuccess: () => {
      notify('Create iSCSI Export successfully', {
        type: 'success',
      });

      setCreateFormModal(false);
    },
    onError: (err) => {
      console.log(err);
      notify('Create iSCSI Export failed', {
        type: 'error',
      });
    },
  });

  const use_all = Form.useWatch('use_all', form);
  const resource_group = Form.useWatch('resource_group', form);

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    setCreateFormModal(false);
  };

  const onFinish = async () => {
    try {
      const values = await form?.validateFields();
      const service_ip_str = prefix + service_ip + '/' + mask;
      const iqn = 'iqn.' + time + '.' + domain + ':' + values.iqn;

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
        username: '',
        password: '',
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

    if (use_all) {
      form.setFieldValue('size', maxVolumeSize);
    }
  }, [form, resourceGroupsFromVSAN, resource_group, use_all]);

  return (
    <>
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
        <Form<FormType>
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          style={{ maxWidth: 800 }}
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
              <Input addonBefore="." placeholder="com.company" onChange={(e) => setDomain(e.target.value)} />
              <Input addonBefore=":" placeholder="unique-name" />
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
                {use_all ? <SizeInput disabled={use_all} /> : <SizeInput />}
              </Form.Item>
              <Form.Item name="use_all" valuePropName="checked">
                <Checkbox>Use all available</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateISCSIForm };