// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@app/utils/logger';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Form, Modal, notification } from 'antd';
import { Input } from '@app/components/Input';
import { Select } from '@app/components/Select';

import { Button } from '@app/components/Button';
import { createResourceGroup, getStoragePool } from '../api';
import { DEFAULT_SP } from '@app/const/type';
import { ErrorMessage } from '@app/features/vsan';
import { variablesOnly } from '@app/utils/mutation';

type FormType = {
  name: string;
  poolName: string | null;
  placeCount: number;
};

type CreateResourceGroupProps = {
  refetch: () => void;
};

export const CreateResourceGroup = ({ refetch }: CreateResourceGroupProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormType>();
  const [api, contextHolder] = notification.useNotification();
  const [createFormModal, setCreateFormModal] = useState(false);

  const { data: storagePool } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const handleOk = () => {
    onFinish();
  };

  const handleCancel = () => {
    setCreateFormModal(false);
  };

  const createMutation = useMutation({
    mutationFn: variablesOnly(createResourceGroup),
    onSuccess: () => {
      api.success({
        title: t('vsan:create_rg_success'),
      });

      setCreateFormModal(false);
      refetch();
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

      if (values.poolName === '---any---') {
        values.poolName = null;
      }

      createMutation.mutate({
        name: values.name,
        placeCount: Number(values.placeCount),
        poolName: values.poolName,
      });
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
        <Form<FormType>
          className="max-w-[800px]"
          size="large"
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{
            placeCount: 2,
            poolName: '---any---',
          }}
        >
          <Form.Item
            label={t('node_detail:resource_group')}
            name="name"
            required
            rules={[{ required: true, message: t('common:resource_group_name_required') }]}
            tooltip={t('vsan:rg_name_tooltip')}
          >
            <Input placeholder={t('common:name')} />
          </Form.Item>

          <Form.Item
            label={t('common:storage_pool')}
            name="poolName"
            required
            rules={[{ required: true, message: t('common:resource_group_required') }]}
            tooltip={t('vsan:any_pool_tooltip')}
          >
            <Select
              allowClear
              placeholder={t('iscsi:please_select_resource_group')}
              options={[
                ...(storagePool?.data ?? [])
                  .filter((e) => e.name !== DEFAULT_SP)
                  .map((e) => ({ label: e.name, value: e.name })),
                { label: '---any---', value: '---any---' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t('common:replica_count')}
            name="placeCount"
            rules={[
              {
                required: true,
              },
            ]}
            tooltip={t('vsan:replicas_tooltip')}
          >
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
