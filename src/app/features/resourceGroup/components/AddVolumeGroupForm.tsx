// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Form, Modal, message } from 'antd';
import { InputNumber } from '@app/components/InputNumber';
import { Button } from '@app/components/Button';
import { useTranslation } from 'react-i18next';

import { addVolumeToResourceGroup } from '../api';
import { AddVolumeRequestBody } from '../types';

type FormType = {
  volume_number?: number;
};

type AddVolumeGroupFormProps = {
  resource_group: string;
  isInDropdown?: boolean;
  refetch?: () => void;
};

const AddVolumeGroupForm = ({ resource_group, isInDropdown = false, refetch }: AddVolumeGroupFormProps) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['resource_group', 'common']);

  const mutation = useMutation({
    mutationFn: (body: AddVolumeRequestBody) => addVolumeToResourceGroup(resource_group, body),
    onSuccess: () => {
      message.success(t('common:add_volume_group_success', 'Volume group added'));
      refetch?.();
      form.resetFields();
      setOpen(false);
    },
    onError: (err: { message?: string }) => {
      message.error(err?.message || t('common:add_volume_group_failed', 'Failed to add volume group'));
    },
  });

  const onFinish = (values: FormType) => {
    const body: AddVolumeRequestBody = {};
    // Volume number is optional — LINSTOR assigns the next free number when omitted.
    if (typeof values.volume_number === 'number') {
      body.volume_number = values.volume_number;
    }
    mutation.mutate(body);
  };

  return (
    <>
      {isInDropdown ? (
        <span onClick={() => setOpen(true)}>{t('common:add_volume_group')}</span>
      ) : (
        <Button type="primary" onClick={() => setOpen(true)}>
          {t('common:add_volume_group')}
        </Button>
      )}
      <Modal
        title={`${t('common:add_volume_group')} — ${resource_group}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button type="secondary" onClick={() => setOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" loading={mutation.isLoading} onClick={() => form.submit()}>
              {t('common:add')}
            </Button>
          </div>
        }
      >
        <Form<FormType>
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFinish}
        >
          <Form.Item
            name="volume_number"
            label={t('common:volume_number', 'Volume Number')}
            tooltip={t('common:volume_number_hint', 'Leave blank to auto-assign the next volume number.')}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder={t('common:auto', 'Auto')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { AddVolumeGroupForm };
