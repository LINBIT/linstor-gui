// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Modal, Select } from 'antd';
import { useTranslation } from 'react-i18next';

import { createVolumeDefinition, getResourceDefinition, getVolumeDefinitionListByResource } from '../api';
import { CreateVolumeDefinitionRequestBody } from '../types';
import { SizeInput } from '@app/components/SizeInput';

type FormType = {
  resource: string;
  size: number;
};

type CreateFormProps = {
  refetch: () => void;
};

const CreateForm = ({ refetch }: CreateFormProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['volume_definition', 'common']);

  const { data: resourceDefinition } = useQuery({
    queryKey: ['getResourceDefinition'],
    queryFn: () => getResourceDefinition({}),
    onSuccess: (data) => {
      data?.data?.forEach(async (item) => {
        if (item?.name) {
          const vd = await getVolumeDefinitionListByResource(item?.name);
          console.log(vd, 'vd');
        }
      });
    },
  });

  const createVD = useMutation({
    mutationFn: (
      data: CreateVolumeDefinitionRequestBody & {
        resource: string;
      },
    ) => {
      const { resource, ...rest } = data;
      return createVolumeDefinition(resource, rest);
    },
  });

  const onFinish = async (values: FormType) => {
    const VDData = {
      resource: values.resource,
      volume_definition: {
        size_kib: values.size,
      },
    };

    createVD.mutate(VDData);
    setShowCreateForm(false);
    refetch && refetch();
  };

  return (
    <>
      <Button type="primary" onClick={() => setShowCreateForm(true)}>
        {t('common:add')}
      </Button>
      <Modal
        title={t('volume_definition:create')}
        open={showCreateForm}
        onOk={() => onFinish(form.getFieldsValue())}
        onCancel={() => setShowCreateForm(false)}
        okText={t('common:spawn')}
        cancelText={t('common:cancel')}
        width={800}
        okButtonProps={{
          loading: createVD.isLoading,
        }}
      >
        <Form<FormType>
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 700 }}
          size="large"
          layout="horizontal"
          form={form}
          initialValues={{
            place_count: 1,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            label={t('common:resource_definition')}
            name="resource"
            required
            rules={[{ required: true, message: 'Please select resource definition!' }]}
          >
            <Select
              allowClear
              placeholder="Please select resource definition"
              options={resourceDefinition?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="size" label={t('common:size')} required>
            <SizeInput />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateForm };
