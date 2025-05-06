// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import { rollbackSnapshot } from '../api';

const { Text } = Typography;

interface RollbackSnapshotFormProps {
  visible: boolean;
  resource: string;
  snapshot: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Component for rollback snapshot confirmation dialog
 *
 * @param visible - Controls the visibility of the modal
 * @param resource - Resource name to rollback
 * @param snapshot - Snapshot name to rollback to
 * @param onClose - Function to close the modal
 * @param onSuccess - Function to call after successful rollback
 */
export const RollbackSnapshotForm: React.FC<RollbackSnapshotFormProps> = ({
  visible,
  resource,
  snapshot,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['common', 'snapshot']);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create mutation for rollback operation
  const rollbackMutation = useMutation({
    mutationKey: ['rollbackSnapshot', resource, snapshot],
    mutationFn: () => rollbackSnapshot(resource, snapshot),
    onSuccess: () => {
      setIsProcessing(false);
      onSuccess();
      onClose();
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

  // Handle rollback confirmation
  const handleRollback = () => {
    setIsProcessing(true);
    rollbackMutation.mutate();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          {t('snapshot:rollback_snapshot')}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common:cancel')}
        </Button>,
        <Button key="rollback" type="primary" danger loading={isProcessing} onClick={handleRollback}>
          {t('snapshot:rollback')}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>
          {t('snapshot:rollback_confirmation_message', {
            resource,
            snapshot,
          })}
        </Text>
        <Text type="danger">{t('snapshot:rollback_warning')}</Text>
        <Text type="warning">{t('snapshot:rollback_usage_warning')}</Text>
      </Space>
    </Modal>
  );
};
