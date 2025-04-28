// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Button, Form, Input, message, Modal, Select } from 'antd';
import { uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useNodes } from '@app/features/node';
import { notifyMessages } from '@app/utils/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getStoragePool } from '@app/features/storagePool';

import { CreateSnapshotRequestBody } from '../types';
import { useResources } from '../hooks';
import { createSnapshot } from '../api';

type FormType = {
  name: string;
  node: string[];
  resource: string;
};

type CollectionCreateFormProps = {
  refetch: () => void;
};

const CreateSnapshotForm = ({ refetch }: CollectionCreateFormProps) => {
  const [form] = Form.useForm<FormType>();
  const { data: nodes } = useNodes();
  const { data: resources } = useResources();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['common', 'snapshot']);

  const resourceList = uniqBy(resources, 'name')?.map((e) => ({
    label: e.name,
    value: e.name,
  }));

  const resource = Form.useWatch('resource_name', form);
  const resourceObj = resources?.find((e) => e.name === resource);
  const disklessNodes = resources
    ?.filter((e) => e.name === resource && e.flags?.includes('DISKLESS') && e.flags.includes('DRBD_DISKLESS'))
    .map((e) => e.node_name);
  const resourceStoragePool = resourceObj?.props?.StorPoolName;

  const { data, isLoading } = useQuery({
    queryKey: ['getStoragePool', resourceStoragePool],
    queryFn: () =>
      getStoragePool({
        storage_pools: [resourceStoragePool || ''],
      }),
    enabled: !!resourceStoragePool,
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: CreateSnapshotRequestBody) => {
      const { resource_name, ...rest } = data;
      return createSnapshot(resource_name || '', rest);
    },
    onSuccess: (data) => {
      if (data?.data && Array.isArray(data?.data)) {
        notifyMessages(data.data);
      }

      setTimeout(() => {
        setOpen(false);
        refetch();
      }, 200);
    },
    onError: () => {
      message.error(t('snapshot:create_failed'));
    },
  });

  const canDoSnapshot = data?.data?.every((e) => e.supports_snapshots);

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('snapshot:create')}
      </Button>
      <Modal
        open={open}
        title={t('snapshot:create')}
        okText={t('common:submit')}
        cancelText={t('common:cancel')}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              form.resetFields();
              createResourceMutation.mutate(values);
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
        >
          {resource && !canDoSnapshot && !isLoading && (
            <div style={{ color: 'red', marginBottom: 20 }}>
              The storage pool does not support snapshots, please select another resource
            </div>
          )}
          <Form.Item name="name" label={t('snapshot:snapshot_name')} required>
            <Input placeholder="Please input snapshot name" />
          </Form.Item>

          <Form.Item
            label={t('snapshot:resource_name')}
            name="resource_name"
            required
            rules={[{ required: true, message: 'Please select nodes!' }]}
          >
            <Select allowClear placeholder="Please select resource" options={resourceList} />
          </Form.Item>

          <Form.Item label={t('snapshot:nodes')} name="nodes">
            <Select
              allowClear
              placeholder="Please select nodes"
              mode="multiple"
              options={nodes
                ?.filter((e) => !disklessNodes?.includes(e.name))
                ?.map((e) => ({
                  label: e.name,
                  value: e.name,
                }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateSnapshotForm };
