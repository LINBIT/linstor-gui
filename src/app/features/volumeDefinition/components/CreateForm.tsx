// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { logger } from '@app/utils/logger';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Form, Modal } from 'antd';
import { Select } from '@app/components/Select';
import { useTranslation } from 'react-i18next';

import { createVolumeDefinition, getResourceDefinition, getVolumeDefinitionListByResource } from '../api';
import { CreateVolumeDefinitionRequestBody } from '../types';
import { SizeInput } from '@app/components/SizeInput';
import { Button } from '@app/components/Button';

type FormType = {
  resource: string;
  size: number;
};

type CreateFormProps = {
  refetch: () => void;
  simple?: boolean;
};

const CreateForm = ({ refetch, simple }: CreateFormProps) => {
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
          logger.debug(vd, 'vd');
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
    // Close and refresh only once the definition exists; refetching before
    // the request has settled showed the list without the new volume.
    onSuccess: () => {
      setShowCreateForm(false);
      form.resetFields();
      refetch?.();
    },
  });

  const onFinish = (values: FormType) => {
    createVD.mutate({
      resource: values.resource,
      volume_definition: {
        size_kib: values.size,
      },
    });
  };

  // The footer button sits outside the form, so validate explicitly instead
  // of reading the raw values; otherwise the required rules never ran.
  const submit = () => {
    form
      .validateFields()
      .then(onFinish)
      .catch(() => undefined);
  };

  return (
    <>
      {simple ? (
        <div className="w-full" onClick={() => setShowCreateForm(true)}>
          {`${t('common:create')} ${t('common:volume_definition')}`}
        </div>
      ) : (
        <Button type="primary" onClick={() => setShowCreateForm(true)}>
          {t('common:add')}
        </Button>
      )}

      <Modal
        title={t('volume_definition:create')}
        open={showCreateForm}
        onCancel={() => setShowCreateForm(false)}
        width={800}
        footer={
          <>
            <Button type="secondary" onClick={() => setShowCreateForm(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={submit} loading={createVD.isLoading}>
              {t('common:spawn')}
            </Button>
          </>
        }
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
              placeholder={t('volume_definition:please_select_resource_definition')}
              options={resourceDefinition?.data?.map((e) => ({
                label: e.name,
                value: e.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="size"
            label={t('common:size')}
            required
            rules={[{ required: true, message: 'Please input size!' }]}
          >
            <SizeInput />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { CreateForm };
