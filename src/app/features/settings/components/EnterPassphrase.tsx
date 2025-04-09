// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useCallback } from 'react';
import { Input, Button, message, Modal, Tooltip } from 'antd';
import styled from '@emotion/styled';
import { useMutation } from '@tanstack/react-query';
import { enterPassPhrase } from '@app/features/settings/passphrase';
import { SettingOutlined } from '@ant-design/icons';
import { FaUnlockAlt } from 'react-icons/fa';

const Wrapper = styled.div`
  padding: 2em 0;
  width: 20em;
`;

export const EnterPassphrase: React.FC = () => {
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
        content: 'Validating passphrase...',
      });
    },
    onSuccess: () => {
      messageApi.open({
        type: 'success',
        content: 'Unlock successfully.',
      });
    },
    onError: () => {
      messageApi.open({
        type: 'error',
        content: 'Failed to unlock.',
      });
    },
  });

  const handleSave = useCallback(() => {
    if (!passphrase) {
      messageApi.open({
        type: 'error',
        content: 'Please enter the passphrase.',
      });
      return;
    } else {
      console.log('Save', passphrase);
      enterPassphrase.mutate(passphrase);
    }
  }, [passphrase, messageApi, enterPassphrase]);

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
      <Tooltip title="Unlock LINSTOR">
        <Button shape="circle" icon={<FaUnlockAlt />} onClick={showModal} />
      </Tooltip>

      <Modal title="LINSTOR Pass-Phrase" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
        <Wrapper>
          <Input.Password
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value);
            }}
            aria-label="pass-phrase"
            type="password"
            width={100}
            placeholder="Enter passphrase"
          />
        </Wrapper>
        <Button type="primary" onClick={handleSave}>
          Unlock
        </Button>
      </Modal>
    </>
  );
};
