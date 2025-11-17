// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Checkbox, Form, Input, Modal } from 'antd';
import { Button } from '@app/components/Button';

import { SizeInput } from '@app/components/SizeInput';
import { SpawnRequest } from '../types';
import { spawnResourceGroup } from '../api';
import { useTranslation } from 'react-i18next';

type FormType = {
  size: number;
  definitions_only: boolean;
  name: string;
};

type SpawnFormProps = {
  resource_group?: string;
  isInDropdown?: boolean;
};

const SpawnForm = ({ resource_group, isInDropdown = false }: SpawnFormProps) => {
  const [showSpawnForm, setShowSpawnForm] = useState(false);
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['resource_group', 'common']);

  const spawnMutation = useMutation({
    mutationFn: (data: SpawnRequest) => {
      return spawnResourceGroup(resource_group ?? '', data);
    },
  });

  const onFinish = async (values: FormType) => {
    const submitData = {
      resource_definition_name: values.name,
      resource_definition_external_name: undefined,
      volume_sizes: [values.size],
      definitions_only: values.definitions_only,
    };

    spawnMutation.mutate(submitData);
    setShowSpawnForm(false);
  };

  return (
    <>
      {isInDropdown ? (
        <span onClick={() => setShowSpawnForm(true)}>{t('common:spawn')}</span>
      ) : (
        <Button type="primary" onClick={() => setShowSpawnForm(true)}>
          {t('common:spawn')}
        </Button>
      )}
      <Modal
        title="Spawn"
        open={showSpawnForm}
        onCancel={() => setShowSpawnForm(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button type="secondary" onClick={() => setShowSpawnForm(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" onClick={() => onFinish(form.getFieldsValue())} loading={spawnMutation.isLoading}>
              {t('common:spawn')}
            </Button>
          </div>
        }
        width={800}
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
          <Form.Item name="name" label="Resource Definition Name" required>
            <Input placeholder="Please resource definition name" />
          </Form.Item>

          <Form.Item name="size" label="Volume Size" required>
            <SizeInput />
          </Form.Item>

          <Form.Item name="definitions_only" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox>Definition only</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { SpawnForm };
