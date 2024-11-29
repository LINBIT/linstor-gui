// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal } from 'antd';

import { autoPlace } from '../api';
import { AutoPlaceRequestBody } from '../types';
import { useTranslation } from 'react-i18next';

type FormType = {
  place_count: number;
  diskless: boolean;
};

type SpawnFormProps = {
  resource?: string;
};

const SpawnForm = ({ resource }: SpawnFormProps) => {
  const [showSpawnForm, setShowSpawnForm] = useState(false);
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['common', 'resource_definitions']);

  const autoPlaceMutation = useMutation({
    mutationFn: (data: AutoPlaceRequestBody) => {
      return autoPlace(resource ?? '', data);
    },
  });

  const onFinish = async (values: FormType) => {
    const deployData = {
      diskless_on_remaining: values.diskless,
      select_filter: { place_count: Number(values.place_count) },
    };

    autoPlaceMutation.mutate(deployData);
    setShowSpawnForm(false);
  };

  return (
    <>
      <Button type="primary" onClick={() => setShowSpawnForm(true)}>
        {t('common:spawn')}
      </Button>
      <Modal
        title={t('common:spawn')}
        open={showSpawnForm}
        onOk={() => onFinish(form.getFieldsValue())}
        onCancel={() => setShowSpawnForm(false)}
        okText="Spawn"
        width={800}
        okButtonProps={{
          loading: autoPlaceMutation.isLoading,
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
          <Form.Item name="place_count" label={t('common:place_count')} required>
            <Input placeholder="Please input place count" type="number" min={0} />
          </Form.Item>

          <Form.Item name="diskless" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
            <Checkbox>{t('common:diskless_on_remaining')}</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { SpawnForm };
