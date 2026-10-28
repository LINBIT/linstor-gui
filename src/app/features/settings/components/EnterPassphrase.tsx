// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message, Modal, Tooltip } from 'antd';
import { Input } from '@app/components/Input';
import { Button } from '@app/components/Button';
import { useMutation } from '@tanstack/react-query';
import { enterPassPhrase } from '@app/features/settings/passphrase';
import { FaUnlockAlt } from 'react-icons/fa';

export const EnterPassphrase: React.FC = () => {
  const { t } = useTranslation();
  const [passphrase, setPassphrase] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const enterPassphrase = useMutation({
    mutationKey: ['enterPassPhrase'],
    mutationFn: (passphrase: string) => {
      return enterPassPhrase(passphrase);
    },
    onMutate: () => {
      messageApi.open({
        type: 'info',
        content: t('settings:passphrase_validating'),
      });
    },
    onSuccess: () => {
      messageApi.open({
        type: 'success',
        content: t('settings:passphrase_unlocked'),
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: () => {
      messageApi.open({
        type: 'error',
        content: t('settings:passphrase_unlock_failed'),
      });
    },
  });

  const handleSave = useCallback(() => {
    if (!passphrase) {
      messageApi.open({
        type: 'error',
        content: t('settings:passphrase_required'),
      });
      return;
    } else {
      enterPassphrase.mutate(passphrase);
    }
  }, [passphrase, messageApi, enterPassphrase, t]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {contextHolder}
      <Tooltip title={t('settings:unlock_linstor')}>
        <Button shape="circle" icon={<FaUnlockAlt />} onClick={showModal} />
      </Tooltip>

      <Modal
        title={t('settings:linstor_passphrase')}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <div className="w-[20em] py-[2em]">
          <Input.Password
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value);
            }}
            aria-label="pass-phrase"
            type="password"
            width={100}
            placeholder={t('settings:enter_passphrase')}
          />
        </div>
        <Button type="primary" onClick={handleSave}>
          {t('common:unlock')}
        </Button>
      </Modal>
    </>
  );
};
