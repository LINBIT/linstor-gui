// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Table } from 'antd';

import { useHA } from './useHA';
import { Button } from '@app/components/Button';
import { deletingRowClass } from '@app/hooks/useDeleteAction';
import { useReactorActions } from './useReactorActions';
import { useHADelete } from './useHADelete';
import { useHAColumns } from './useHAColumns';
import { DeleteHAModal } from './DeleteHAModal';
import { FileContentModal } from './FileContentModal';
import { ManageModal } from './ManageModal';
import { useUnmanagedFiles } from './useUnmanagedFiles';

export const List = () => {
  const { t } = useTranslation(['ha']);
  const { data, isPending: isLoading } = useHA();

  const reactor = useReactorActions();
  const deletion = useHADelete({ getPrimaryNode: reactor.getPrimaryNode, disableMutation: reactor.disableMutation });

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewFilePath, setViewFilePath] = useState('');

  // Manage modal state
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const unmanagedFiles = useUnmanagedFiles(data);

  const openViewModal = (filePath: string) => {
    setViewFilePath(filePath);
    setViewModalVisible(true);
  };

  const columns = useHAColumns({ reactor, onViewFile: openViewModal, onDelete: deletion.setDeleteTarget });

  // Nodes that gave no status: without drbd-reactor they would otherwise just show nothing.
  const failures = reactor.reactorFailures ?? [];
  const notInstalled = failures.filter((f) => f.notInstalled).map((f) => f.node);
  const otherFailures = failures.filter((f) => !f.notInstalled);
  const installedNowhere = notInstalled.length > 0 && notInstalled.length === reactor.nodeNames.length;

  return (
    <>
      {notInstalled.length > 0 && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title={
            installedNowhere
              ? t('ha:reactor_not_installed_anywhere')
              : t('ha:reactor_not_installed_on', { nodes: notInstalled.join(', ') })
          }
        />
      )}
      {otherFailures.length > 0 && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          title={
            <>
              {otherFailures.map((f) => (
                <div key={f.node}>{t('ha:reactor_status_failed', { node: f.node, message: f.message })}</div>
              ))}
            </>
          }
        />
      )}
      {unmanagedFiles.length > 0 && (
        <div className="mb-4">
          <Button onClick={() => setManageModalVisible(true)}>Manage ({unmanagedFiles.length} unmanaged)</Button>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="uuid"
        loading={isLoading}
        pagination={false}
        rowClassName={(record) => (deletion.haDelete.isDeleting(record.uuid) ? deletingRowClass : '')}
      />
      <DeleteHAModal {...deletion} />
      <FileContentModal filePath={viewFilePath} visible={viewModalVisible} onClose={() => setViewModalVisible(false)} />
      <ManageModal
        open={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
        unmanagedFiles={unmanagedFiles}
      />
    </>
  );
};
