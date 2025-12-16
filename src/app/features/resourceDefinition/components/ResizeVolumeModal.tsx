// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect } from 'react';
import { Button } from '@app/components/Button';
import { Form, Input, Modal, Select, Space, Spin, Checkbox, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVolumeDefinitionListByResource, updateVolumeDefinition } from '../api';
import { sizeOptions, convertRoundUp } from '@app/utils/size';
import { useTranslation } from 'react-i18next';

interface ResizeVolumeModalProps {
  open: boolean;
  onClose: () => void;
  resourceName: string;
  onSuccess?: () => void;
}

const { Option } = Select;

const bestUnit = (kib: number) => {
  if (!kib) return { value: 0, unit: 'KiB' };
  if (kib % (1024 * 1024) === 0) return { value: kib / (1024 * 1024), unit: 'GiB' };
  if (kib % 1024 === 0) return { value: kib / 1024, unit: 'MiB' };
  return { value: kib, unit: 'KiB' };
};

export const ResizeVolumeModal: React.FC<ResizeVolumeModalProps> = ({ open, onClose, resourceName, onSuccess }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['common']);

  const { data: volumeDefinitions, isLoading } = useQuery({
    queryKey: ['getVolumeDefinitionListByResource', resourceName],
    queryFn: () => getVolumeDefinitionListByResource(resourceName),
    enabled: open && !!resourceName,
  });

  const mutation = useMutation({
    mutationFn: (vars: { volNr: number; size: number; gross?: boolean }) =>
      updateVolumeDefinition(resourceName, vars.volNr, {
        size_kib: vars.size,
        ...(vars.gross && { flags: ['GROSS_SIZE'] }),
      }),
  });

  useEffect(() => {
    if (open && volumeDefinitions?.data) {
      const initialValues = {};
      volumeDefinitions.data.forEach((vol) => {
        const { value, unit } = bestUnit(vol.size_kib ?? 0);
        initialValues[`vol_${vol.volume_number}_size`] = value;
        initialValues[`vol_${vol.volume_number}_unit`] = unit;
      });
      // Add gross checkbox default value (unchecked)
      initialValues.gross = false;
      form.setFieldsValue(initialValues);
    }
  }, [open, volumeDefinitions, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!volumeDefinitions?.data) return;

      const isGross = values.gross || false;

      const promises = volumeDefinitions.data.map((vol) => {
        const sizeVal = values[`vol_${vol.volume_number}_size`];
        const unitVal = values[`vol_${vol.volume_number}_unit`];
        const newSizeKib = convertRoundUp(unitVal, Number(sizeVal));

        console.log(
          `Checking vol ${vol.volume_number}: New=${newSizeKib} (from ${sizeVal} ${unitVal}), Old=${vol.size_kib}, Gross=${isGross}`,
        );

        if (newSizeKib !== vol.size_kib) {
          return mutation.mutateAsync({
            volNr: vol.volume_number ?? 0,
            size: newSizeKib,
            gross: isGross,
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      message.success(t('common:operation_success'));
      queryClient.invalidateQueries({ queryKey: ['getVolumeDefinitionListByResource'] });
      onClose();
      onSuccess?.();
    } catch (error) {
      // Form validation error or API error
      console.error(error);
    }
  };

  return (
    <Modal
      title={`${t('common:resize')} ${resourceName}`}
      open={open}
      destroyOnClose
      onCancel={onClose}
      footer={[
        <Button key="cancel" type="secondary" onClick={onClose}>
          {t('common:cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={mutation.isPending} onClick={handleOk}>
          {t('common:ok')}
        </Button>,
      ]}
    >
      {isLoading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical">
          {volumeDefinitions?.data?.map((vol) => (
            <Form.Item key={vol.volume_number} label={`Volume ${vol.volume_number}`} required>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name={`vol_${vol.volume_number}_size`}
                  noStyle
                  rules={[{ required: true, message: 'Please input size' }]}
                >
                  <Input type="number" style={{ width: '50%' }} />
                </Form.Item>
                <Form.Item name={`vol_${vol.volume_number}_unit`} noStyle rules={[{ required: true }]}>
                  <Select style={{ width: '25%' }}>
                    {sizeOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="gross"
                  valuePropName="checked"
                  noStyle
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Checkbox style={{ alignItems: 'center', alignSelf: 'center', marginLeft: '8px' }}>
                    Gross Size
                  </Checkbox>
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          ))}
        </Form>
      )}
    </Modal>
  );
};
