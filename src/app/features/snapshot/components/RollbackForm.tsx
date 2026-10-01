// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Modal, Typography, Space, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button } from '@app/components/Button';
import { replyError } from '@app/hooks/useDeleteAction';
import { withQuietToasts } from '@app/utils/toast';

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

  // A rollback reply is a whole sequence (safety snapshot, resources torn
  // down and restored, safety snapshot deleted) without one entry that says
  // "rolled back", so the reply stays quiet and the outcome is reported here.
  // openapi-fetch resolves on an HTTP error; a refusal must not close the
  // dialog as if it had worked.
  const rollbackMutation = useMutation({
    mutationKey: ['rollbackSnapshot', resource, snapshot],
    mutationFn: () =>
      withQuietToasts(async () => {
        const error = replyError(await rollbackSnapshot(resource, snapshot));
        if (error) {
          throw new Error(error);
        }
      }),
    onSuccess: () => {
      setIsProcessing(false);
      message.success(t('common:operation_success'));
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      message.error({ content: `${t('common:failed')}: ${error.message}`, duration: 10 });
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
        <Button key="cancel" type="secondary" onClick={onClose}>
          {t('common:cancel')}
        </Button>,
        <Button key="rollback" type="primary" danger loading={isProcessing} onClick={handleRollback}>
          {t('snapshot:rollback')}
        </Button>,
      ]}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
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
