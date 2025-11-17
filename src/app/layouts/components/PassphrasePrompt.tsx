// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { Form, Input, Modal, Tooltip, Spin } from 'antd';
import { Button } from '@app/components/Button';
import { IoIosWarning } from 'react-icons/io';
import { LockIcon, UnlockedIcon } from '@app/components/SVGIcon';
import { LoadingOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPassphraseStatus, createPassphrase, enterPassPhrase } from '@app/features/settings/passphrase';

interface PassphraseStatus {
  status: 'unset' | 'locked' | 'unlocked';
}

interface PassphraseFormValues {
  passphrase: string;
  confirmPassphrase?: string;
}

const PassphrasePrompt: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [form] = Form.useForm<PassphraseFormValues>();
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const queryClient = useQueryClient();

  // Fetch passphrase status
  const { data: passphraseData, isLoading } = useQuery<PassphraseStatus>({
    queryKey: ['passphraseStatus'],
    queryFn: async (): Promise<PassphraseStatus> => {
      const response = (await getPassphraseStatus()) as unknown as {
        data: { status: 'unset' | 'locked' | 'unlocked' };
      };
      return { status: response?.data?.status || 'unset' };
    },
  });

  const status = passphraseData?.status || 'unset';

  // Create passphrase mutation
  const createPassphraseMutation = useMutation({
    mutationFn: createPassphrase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passphraseStatus'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error) => {
      console.error('Failed to set passphrase:', error);
    },
  });

  // Enter passphrase mutation
  const enterPassphraseMutation = useMutation({
    mutationFn: enterPassPhrase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passphraseStatus'] });
      setIsModalOpen(false);
      form.resetFields();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      console.error('Failed to unlock passphrase:', error);
    },
  });

  // Set passphrase
  const handleSetPassphrase = async (values: PassphraseFormValues) => {
    try {
      await createPassphraseMutation.mutateAsync(values.passphrase);
    } catch {
      // Error is handled in onError callback
    }
  };

  // Unlock passphrase
  const handleUnlockPassphrase = async (values: PassphraseFormValues) => {
    try {
      await enterPassphraseMutation.mutateAsync(values.passphrase);
    } catch {
      // Error is handled in onError callback
    }
  };

  // Handle icon click based on status
  const handleClick = () => {
    if (status !== 'unlocked') {
      setIsModalOpen(true);
    }
  };

  // Render icon based on status
  const renderIcon = () => {
    if (isLoading) {
      return (
        <Tooltip title={t('settings:linstor_passphrase_loading', 'Loading passphrase status')}>
          <div>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: 'white' }} spin />} />
          </div>
        </Tooltip>
      );
    }

    switch (status) {
      case 'unset':
        return (
          <Tooltip title={t('settings:passphrase_not_set', 'Passphrase not set')}>
            <div>
              <IoIosWarning className="text-white cursor-pointer" size={24} onClick={handleClick} />
            </div>
          </Tooltip>
        );
      case 'locked':
        return (
          <Tooltip title={t('settings:linstor_locked', 'LINSTOR is locked')}>
            <div className="inline-block cursor-pointer" onClick={handleClick}>
              <LockIcon className="text-[#FFF]" />
            </div>
          </Tooltip>
        );
      case 'unlocked':
        return (
          <Tooltip title={t('settings:linstor_unlocked', 'LINSTOR is unlocked')}>
            <div className="inline-block">
              <UnlockedIcon className="text-[#FFF]" />
            </div>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  // Modal title and content based on status
  const modalTitle =
    status === 'unset'
      ? t('settings:set_passphrase', 'Set Passphrase')
      : t('settings:unlock_passphrase', 'Unlock Passphrase');
  const submitButtonText =
    status === 'unset' ? t('settings:set_passphrase', 'Set Passphrase') : t('common:unlock', 'Unlock');

  return (
    <div className="flex items-center text-base">
      {renderIcon()}

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={status === 'unset' ? handleSetPassphrase : handleUnlockPassphrase}
        >
          <Form.Item
            name="passphrase"
            label={t('settings:passphrase', 'Passphrase')}
            rules={[
              {
                required: true,
                message: t('settings:please_input_passphrase', 'Please input your passphrase!'),
              },
            ]}
          >
            <Input.Password placeholder={t('settings:enter_passphrase', 'Enter passphrase')} />
          </Form.Item>

          {status === 'unset' && (
            <Form.Item
              name="confirmPassphrase"
              label={t('settings:confirm_passphrase', 'Confirm Passphrase')}
              dependencies={['passphrase']}
              rules={[
                {
                  required: true,
                  message: t('settings:please_confirm_passphrase', 'Please confirm your passphrase!'),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('passphrase') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t('settings:passphrase_not_match', 'The two passphrases do not match!')),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder={t('settings:confirm_passphrase_placeholder', 'Confirm passphrase')} />
            </Form.Item>
          )}

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button
                type="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                }}
              >
                {t('common:cancel', 'Cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPassphraseMutation.isLoading || enterPassphraseMutation.isLoading}
              >
                {submitButtonText}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PassphrasePrompt;
