// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Collapse, Form, Input, Radio, Select, Switch, Tooltip } from 'antd';
import { useHistory } from 'react-router-dom';

import {
  getPhysicalStoragePoolByNode,
  ProviderKind,
  CreatePhysicalStorageRequestBody,
  createPhysicalStorage,
  createStoragePool,
  CreateStoragePoolRequestBody,
} from '@app/features/storagePool';
import { useNodes } from '@app/features/node';
import { SizeInput } from '@app/components/SizeInput';

// This is for concat LV Name and VG Name
// it would be like this:
//    LV Name                LinstorStorage
//    VG Name                linstor_LinstorStorage
const POOL_NAME = 'LinstorStorage';

type FormType = {
  create_type: 'new' | 'existing';
  storage_pool_name: string;
  pool_name?: string;
  node: string;
  provider_kind: ProviderKind;
  device_path: string;
  storage_driver_name: string;
  multiple_nodes: boolean;
  sed?: boolean;
  vdo_enable?: boolean;
  vdo_slab_size_kib?: number;
  vdo_logical_size_kib?: number;
};

const CreateForm = () => {
  const nodes = useNodes();
  const history = useHistory();

  const [form] = Form.useForm<FormType>();
  const provider_kind = Form.useWatch('provider_kind', form);
  const node = Form.useWatch('node', form);
  const create_type = Form.useWatch('create_type', form);
  const multiple_nodes = Form.useWatch('multiple_nodes', form);
  const vdo_enable = Form.useWatch('vdo_enable', form);

  const backToStoragePoolList = () => {
    history.goBack();
  };

  const { data: devicePathOptions } = useQuery({
    queryKey: ['getPhysicalStoragePoolByNode', node],
    queryFn: () => getPhysicalStoragePoolByNode({ node: Array.isArray(node) ? node[0] : node }),
    enabled: !!node && create_type === 'new',
  });

  const createStoragePoolWithPhysicalStorage = useMutation({
    mutationFn: (data: CreatePhysicalStorageRequestBody & { node: string }) => {
      const { node, ...rest } = data;
      return createPhysicalStorage(node, rest);
    },
  });

  const createStoragePoolWithExistingVolumeGroup = useMutation({
    mutationFn: (
      data: CreateStoragePoolRequestBody & {
        node: string;
      },
    ) => {
      const { node, ...rest } = data;

      return createStoragePool(node, rest);
    },
    onSuccess: () => backToStoragePoolList(),
  });

  // should be DISKLESS, LVM, LVM_THIN, ZFS, ZFS_THIN, OPENFLEX_TARGET, FILE, FILE_THIN, SPDK, EBS_TARGET, EBS_INIT
  // but for now, we only support LVM and LVM_THIN
  const typeList = [
    { label: 'LVM', value: 'LVM' },
    { label: 'LVM_THIN', value: 'LVM_THIN' },
  ];

  const onFinish = (values: FormType) => {
    // use create_type to determine the request body
    // for new: we use /v1/physical-storage/{node} to create the physical storage and storage pool
    if (create_type === 'new') {
      const {
        storage_pool_name,
        pool_name,
        provider_kind,
        device_path,
        sed,
        vdo_enable,
        vdo_slab_size_kib,
        vdo_logical_size_kib,
      } = values;

      const advancedOptions = {
        sed,
        vdo_enable,
        vdo_slab_size_kib,
        vdo_logical_size_kib,
      };

      const body: CreatePhysicalStorageRequestBody = {
        pool_name: pool_name ? pool_name : POOL_NAME,
        provider_kind,
        device_paths: [device_path],
        with_storage_pool: {
          name: storage_pool_name,
        },
        ...advancedOptions,
      };

      const promiseArr = [];

      if (Array.isArray(node)) {
        node.forEach((e) => {
          promiseArr.push(createStoragePoolWithPhysicalStorage.mutate({ node: e, ...body }));
        });
      } else {
        promiseArr.push(createStoragePoolWithPhysicalStorage.mutate({ node, ...body }));
      }

      Promise.all(promiseArr).then(() => {
        backToStoragePoolList();
      });
    }

    if (create_type === 'existing') {
      const { storage_pool_name, provider_kind, storage_driver_name, node: selectedNode } = values;

      const body = {
        storage_pool_name: storage_pool_name,
        provider_kind,
        props: {
          'StorDriver/StorPoolName': storage_driver_name,
        },
      };

      if (Array.isArray(selectedNode)) {
        selectedNode.forEach((e) => {
          createStoragePoolWithExistingVolumeGroup.mutate({ node: e, ...body });
        });
      } else {
        createStoragePoolWithExistingVolumeGroup.mutate({ node: selectedNode, ...body });
      }
    }
  };

  return (
    <Form
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      size="large"
      layout="horizontal"
      form={form}
      initialValues={{
        provider_kind: 'LVM',
        create_type: 'new',
      }}
      onFinish={onFinish}
    >
      <Form.Item name="create_type">
        <Radio.Group
          onChange={() => {
            form.setFieldsValue({ node: undefined, device_path: undefined });
          }}
        >
          <Tooltip title="When creating storage pool using new device, please make sure the device is empty.">
            <Radio.Button value="new">New Device</Radio.Button>
          </Tooltip>

          <Tooltip title="To use an existing device, first create a volume group and logical volume by using LVM CLI commands.">
            <Radio.Button value="existing">Existing Device</Radio.Button>
          </Tooltip>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="storage_pool_name"
        label="Storage Pool Name"
        required
        rules={[
          { required: true, message: 'Enter storage pool name.' },
          {
            pattern: new RegExp('^(?!-)[a-zA-Z_][a-zA-Z0-9_-]{1,47}[-a-zA-Z0-9_]$'),
            message: 'Please input a valid storage pool name!',
          },
        ]}
      >
        <Input placeholder="Enter storage pool name." />
      </Form.Item>

      {create_type === 'new' && (
        <Form.Item
          name="multiple_nodes"
          label="Multiple Nodes"
          tooltip="Create the storage pool on more than one node."
        >
          <Switch />
        </Form.Item>
      )}

      <Form.Item
        label="Node"
        name="node"
        required
        rules={[{ required: true, message: 'Please select nodes!' }]}
        tooltip="Select the node or nodes to create the storage pool on."
      >
        <Select
          allowClear
          placeholder="Select the node or nodes."
          options={nodes?.data?.map((e) => ({
            label: e.name,
            value: e.name,
          }))}
          mode={create_type !== 'new' || multiple_nodes ? 'multiple' : undefined}
        />
      </Form.Item>

      <Form.Item
        label="Type"
        name="provider_kind"
        required
        tooltip="Select the type of logical volume that the storage pool will carve out storage volumes from the physical storage. NOTE: Some LINSTOR features, such as volume snapshots, are only supported on thin-provisioned volumes."
      >
        <Radio.Group>
          {typeList.map((e) => {
            return (
              <Radio value={e.value} key={e.value}>
                {e.label}
              </Radio>
            );
          })}
        </Radio.Group>
      </Form.Item>

      {create_type === 'new' && (
        <>
          <Form.Item
            label="Device Path"
            name="device_path"
            required
            rules={[{ required: true, message: 'Please select device path!' }]}
            tooltip="Select the path of the physical device that will back the storage pool."
          >
            <Select
              allowClear
              placeholder="Select the path of the physical device."
              options={devicePathOptions?.data?.map((e) => ({
                label: e.device,
                value: e.device,
              }))}
            />
          </Form.Item>

          <Collapse
            ghost
            items={[
              {
                key: '1',
                label: 'Advanced Options',
                children: (
                  <>
                    <Form.Item label="LVM Pool Name" name="pool_name" tooltip="VG or VG/Thinpool Name">
                      <Input placeholder="Enter pool name" />
                    </Form.Item>
                    <Form.Item label="SED Enabled" name="sed" valuePropName="checked" tooltip="Self Encrypting Drive">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="VDO Enabled" name="vdo_enable" valuePropName="checked">
                      <Switch />
                    </Form.Item>

                    {vdo_enable && (
                      <>
                        <Form.Item label="VDO Slab Size" name="vdo_slab_size_kib" tooltip="The size of the VDO slab.">
                          <SizeInput />
                        </Form.Item>
                        <Form.Item
                          label="VDO Logical Size"
                          name="vdo_logical_size_kib"
                          tooltip="The logical size of the VDO volume."
                        >
                          <SizeInput />
                        </Form.Item>
                      </>
                    )}
                  </>
                ),
              },
            ]}
          />
        </>
      )}

      {create_type === 'existing' && (
        <Form.Item
          name="storage_driver_name"
          label={provider_kind === 'LVM' ? 'Volume Group' : 'Volume Group/Thin Pool'}
          required
        >
          <Input
            placeholder={`Please input ${provider_kind === 'LVM_THIN' ? 'Volume Group/Thin Pool' : 'Volume Group'}`}
          />
        </Form.Item>
      )}

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          disabled={
            createStoragePoolWithExistingVolumeGroup.isLoading || createStoragePoolWithPhysicalStorage.isLoading
          }
        >
          Submit
        </Button>

        <Button type="text" onClick={backToStoragePoolList}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export { CreateForm };
