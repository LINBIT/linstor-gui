// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Form, Modal } from 'antd';
import { InputNumber } from '@app/components/InputNumber';
import { Button } from '@app/components/Button';
import { useTranslation } from 'react-i18next';

import { addVolumeToResourceGroup } from '../api';
import { unwrap } from '@app/features/requests';
import { AddVolumeRequestBody } from '../types';

type FormType = {
  volume_number?: number;
};

type AddVolumeGroupFormProps = {
  resource_group: string;
  /**
   * Given, the dialog is opened by the caller (a row menu entry, whose whole row
   * is the click target) and no button is rendered.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  refetch?: () => void;
};

const AddVolumeGroupForm = ({ resource_group, open: openProp, onOpenChange, refetch }: AddVolumeGroupFormProps) => {
  const [ownOpen, setOwnOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : ownOpen;
  const setOpen = (next: boolean) => (controlled ? onOpenChange?.(next) : setOwnOpen(next));
  const [form] = Form.useForm<FormType>();
  const { t } = useTranslation(['resource_group', 'common']);

  // The dialog stays open until the controller answers: a refused volume group
  // keeps what was typed, one that went through closes it. The reply itself is
  // toasted by the request layer, once.
  const mutation = useMutation({
    mutationFn: (body: AddVolumeRequestBody) => unwrap(addVolumeToResourceGroup(resource_group, body)),
    onSuccess: () => {
      refetch?.();
      form.resetFields();
      setOpen(false);
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
      {!controlled && (
        <Button type="primary" onClick={() => setOpen(true)}>
          {t('common:add_volume_group')}
        </Button>
      )}
      <Modal
        title={`${t('common:add_volume_group')} — ${resource_group}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="secondary" onClick={() => setOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
              {t('common:submit')}
            </Button>
          </div>
        }
      >
        <Form<FormType> form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="volume_number"
            label={t('common:volume_number', 'Volume Number')}
            tooltip={t('common:volume_number_hint', 'Leave blank to auto-assign the next volume number.')}
          >
            <InputNumber min={0} className="w-full" placeholder={t('common:auto', 'Auto')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export { AddVolumeGroupForm };
