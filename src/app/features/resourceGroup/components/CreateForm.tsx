import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Checkbox, Col, Form, Input, Radio, Row, Select, Switch } from 'antd';
import { useHistory } from 'react-router-dom';
import uniqby from 'lodash.uniqby';
import { toast } from 'react-toastify';

import { useStoragePools } from '@app/features/storagePool';
import { fullySuccess } from '@app/features/requests';
import { createResourceGroup, addVolumeToResourceGroup, updateResourceGroup } from '../api';
import { ResourceGroupCreateRequestBody, AddVolumeRequestBody, ResourceGroupModifyRequestBody } from '../types';
import { DownOutlined } from '@ant-design/icons';
import { SizeInput } from '@app/components/SizeInput';

type FormType = {
  name: string;
  description: string;
  storage_pool: string;
  size: number;
  deploy: boolean;
  place_count: number;
  diskless: boolean;
  not_place_with_rsc: string[];
  not_place_with_rsc_regex: string;
  replicas_on_same: string[];
  replicas_on_different: string[];
  diskless_on_remaining: boolean;
  storage_pool_list: string[];
  layer_stack: string[];
  provider_list: string[];
  data_copy_mode: 'A' | 'C';
};

/**
 * options of layers
 */
const layerList = ['cache', 'storage', 'drbd', 'nvme', 'luks', 'writechache', 'openflex', 'exos'];
/**
 * options of providers
 */
const providerList = [
  'LVM',
  'LVM_THIN',
  'ZFS',
  'ZFS_THIN',
  'DISKLESS',
  'FILE',
  'FILE_THIN',
  'SPDK',
  'OPENFLEX_TARGET',
  'EXOS',
];

const CreateForm = () => {
  const [expand, setExpand] = useState(false);
  const history = useHistory();
  const [form] = Form.useForm<FormType>();

  const deploy = Form.useWatch('deploy', form);
  const layer_stack = Form.useWatch('layer_stack', form);

  const backToList = () => {
    history.push('/software-defined/resource-groups');
  };

  const { isLoading: storagePoolsIsLoading, data: storagePools } = useStoragePools();

  const createResourceGroupMutation = useMutation({
    mutationFn: (data: ResourceGroupCreateRequestBody) => createResourceGroup(data),
  });

  const addVolumeToResourceGroupMutation = useMutation({
    mutationFn: (
      data: AddVolumeRequestBody & {
        resource_group: string;
      }
    ) => {
      const { resource_group, ...rest } = data;
      return addVolumeToResourceGroup(resource_group, rest);
    },
  });

  const updateResourceGroupMutation = useMutation({
    mutationFn: (
      data: ResourceGroupModifyRequestBody & {
        resource_group: string;
      }
    ) => {
      const { resource_group, ...rest } = data;
      return updateResourceGroup(resource_group, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    const rg = {
      name: values.name,
      description: values.description,
      select_filter: {
        not_place_with_rsc: values.not_place_with_rsc,
        not_place_with_rsc_regex: values.not_place_with_rsc_regex,
        replicas_on_same: values.replicas_on_same,
        replicas_on_different: values.replicas_on_different,
        diskless_on_remaining: values.diskless_on_remaining,
        storage_pool_list: values.storage_pool_list,
        layer_stack: values.layer_stack,
        provider_list: values.provider_list,
        place_count: Number(values.place_count),
      },
    };

    const rgRes = await createResourceGroupMutation.mutateAsync(rg);
    if (fullySuccess(rgRes.data)) {
      const modifyResourceGroupRes = await updateResourceGroupMutation.mutateAsync({
        resource_group: values.name,
        override_props: {
          'DrbdOptions/Net/protocol': values.data_copy_mode,
          'DrbdOptions/PeerDevice/c-max-rate': '4194304',
        },
      });

      const addVolumeRes = await addVolumeToResourceGroupMutation.mutateAsync({
        resource_group: values.name,
      });

      if (fullySuccess(addVolumeRes.data) && fullySuccess(modifyResourceGroupRes.data)) {
        backToList();
      }
    }
  };

  const isSubmitting =
    updateResourceGroupMutation.isLoading ||
    addVolumeToResourceGroupMutation.isLoading ||
    createResourceGroupMutation.isLoading;

  return (
    <Form<FormType>
      size="large"
      layout="horizontal"
      labelCol={{ span: 7 }}
      wrapperCol={{ span: 17 }}
      form={form}
      initialValues={{
        data_copy_mode: 'C',
        deploy: true,
        place_count: 2,
      }}
      onFinish={onFinish}
    >
      <Row gutter={[16, 16]}>
        <Col span={10}>
          <Form.Item
            label="Name"
            name="name"
            required
            rules={[
              {
                required: true,
                message: 'Resource group name is required!',
              },
            ]}
          >
            <Input placeholder="Please input resource group name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Please input description"
              autoSize={{
                minRows: 1,
              }}
            />
          </Form.Item>

          <Form.Item label="Replication Mode" name="data_copy_mode">
            <Radio.Group>
              <Radio value="A">Asynchronous</Radio>
              <Radio value="C">Synchronous</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="place_count" label="Place Count" required>
            <Input placeholder="Please input place count" type="number" min={0} />
          </Form.Item>

          <Form.Item label="Deploy" name="deploy" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item name="diskless_on_remaining" valuePropName="checked" wrapperCol={{ offset: 7, span: 17 }}>
            <Checkbox>Diskless</Checkbox>
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item
            label="Providers"
            name="provider_list"
            required
            rules={[{ required: true, message: 'Please select providers' }]}
          >
            <Select
              allowClear
              mode="multiple"
              placeholder="Please select providers"
              options={providerList?.map((e) => ({
                label: e,
                value: e,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Layers"
            name="layer_stack"
            required
            rules={[{ required: true, message: 'Please select layers' }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Please select layers"
              options={layerList.map((e) => ({
                label: e,
                value: e,
              }))}
              onChange={(val) => {
                if (!layer_stack.includes('drbd') && val.includes('drbd')) {
                  toast('Please make sure you have drbd-kmod installed on the nodes you wish to use DRBD on', {
                    type: 'info',
                  });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Storage Pool"
            name="storage_pool_list"
            required
            rules={[{ required: true, message: 'Please select storage pool!' }]}
          >
            <Select
              allowClear
              placeholder="Please select storage pool"
              mode="multiple"
              options={uniqby(storagePools, 'storage_pool_name')?.map((e) => ({
                label: e.storage_pool_name,
                value: e.storage_pool_name,
              }))}
            />
          </Form.Item>
          {deploy && (
            <>
              <Form.Item
                label="Resource Definition Name"
                name="resource_definition_name"
                required
                rules={[
                  {
                    required: true,
                    message: 'Resource definition name is required!',
                  },
                ]}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
              >
                <Input placeholder="Please input resource definition group name" />
              </Form.Item>

              <Form.Item name="size" label="Volume Size" required>
                <SizeInput />
              </Form.Item>

              <Form.Item name="definition_only" valuePropName="checked" wrapperCol={{ offset: 7, span: 17 }}>
                <Checkbox>Definition Only</Checkbox>
              </Form.Item>
            </>
          )}
        </Col>
      </Row>

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <a
          style={{ fontSize: 16 }}
          onClick={() => {
            setExpand(!expand);
          }}
        >
          <DownOutlined rotate={expand ? 180 : 0} rev={undefined} />
          {!expand ? 'Show advanced settings' : 'Hide advanced settings'}
        </a>
      </div>

      {expand && (
        <Row gutter={[16, 16]}>
          <Col span={10}>
            <Form.Item label="Replicas On Same" name="replicas_on_same">
              <Select mode="tags" allowClear placeholder="" />
            </Form.Item>

            <Form.Item label="Replicas On Different" name="replicas_on_different">
              <Select mode="tags" allowClear placeholder="" />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item label="Do Not Place With" name="not_place_with_rsc">
              <Input placeholder="" />
            </Form.Item>

            <Form.Item
              label="Do Not Place With Regex"
              name="not_place_with_rsc_regex"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
            >
              <Input placeholder="" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <div style={{ marginLeft: 80 }}>
        <Button type="primary" htmlType="submit" disabled={storagePoolsIsLoading || isSubmitting}>
          Submit
        </Button>

        <Button type="text" onClick={backToList}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export { CreateForm };
