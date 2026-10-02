// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'antd';
import { Button } from '@app/components/Button';
import type { useHADelete } from './useHADelete';

type DeleteHAModalProps = ReturnType<typeof useHADelete>;

/** Confirms deleting the HA configuration of `deleteTarget`. */
export const DeleteHAModal: React.FC<DeleteHAModalProps> = ({ haDelete, deleteTarget, setDeleteTarget }) => {
  const { t } = useTranslation(['ha', 'common']);

  return (
    <Modal
      title={t('common:delete')}
      open={!!deleteTarget}
      onCancel={() => !haDelete.busy && setDeleteTarget(null)}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteTarget(null)} disabled={haDelete.busy}>
            {t('common:cancel')}
          </Button>
          <Button
            type="primary"
            danger
            loading={haDelete.busy}
            onClick={async () => {
              if (deleteTarget) {
                await haDelete.run([deleteTarget]);
              }
              setDeleteTarget(null);
            }}
          >
            {t('common:delete')}
          </Button>
        </div>
      }
    >
      {deleteTarget &&
        `Are you sure you want to delete "${deleteTarget.name}"? Its services are stopped and the HA configuration file is removed from all nodes.`}
    </Modal>
  );
};
