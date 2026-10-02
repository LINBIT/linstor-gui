// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState } from 'react';
import { Modal } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Input } from '@app/components/Input';
import { createSnapshot } from '@app/features/snapshot/api';
import { replyError } from '@app/hooks/useDeleteAction';

interface CreateSnapshotModalProps {
  open: boolean;
  resource?: string;
  onClose: () => void;
}

/** Names and takes a snapshot of one resource. */
export const CreateSnapshotModal: React.FC<CreateSnapshotModalProps> = ({ open, resource, onClose }) => {
  const { t } = useTranslation(['volume', 'common']);
  const queryClient = useQueryClient();
  const [snapshotName, setSnapshotName] = useState<string>('');

  // openapi-fetch reports a refused snapshot in `error` rather than throwing;
  // the fetch proxy toasts it, and the dialog stays open to correct the name.
  const handleCreateSnapShot = async () => {
    if (resource && snapshotName != '') {
      const res = await createSnapshot(resource, { name: snapshotName });
      if (replyError(res)) return;
      onClose();
      setSnapshotName('');
      void queryClient.invalidateQueries({ queryKey: ['getSnapshots'] });
    }
  };

  return (
    <Modal title={t('resource:create_snapshot')} open={open} onCancel={onClose} onOk={handleCreateSnapShot}>
      <Input
        type="text"
        placeholder={t('resource:please_input_snapshot_name')}
        value={snapshotName}
        onChange={(evt) => {
          setSnapshotName(evt.target.value);
        }}
      />
    </Modal>
  );
};
