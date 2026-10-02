// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography, message } from 'antd';
import { Select } from '@app/components/Select';
import { Button } from '@app/components/Button';
import { useAllResourceDefinitions, useManageHA } from './useHA';

const { Text } = Typography;

interface ManageModalProps {
  open: boolean;
  onClose: () => void;
  unmanagedFiles: Array<{ path: string }>;
}

/** Puts an unmanaged DRBD Reactor file under a resource definition. */
export const ManageModal: React.FC<ManageModalProps> = ({ open, onClose, unmanagedFiles }) => {
  const { t } = useTranslation(['ha', 'common']);
  const [manageFile, setManageFile] = useState<string | undefined>();
  const [manageResource, setManageResource] = useState<string | undefined>();

  // Manage mutation
  const manageMutation = useManageHA();
  const { data: allRDData } = useAllResourceDefinitions();

  const allResourceDefinitions = useMemo(() => {
    return ((allRDData?.data as Array<{ name: string }>) || []).map((rd) => rd.name);
  }, [allRDData]);

  const handleManageSubmit = () => {
    if (!manageFile || !manageResource) return;
    manageMutation.mutate(
      { resourceName: manageResource, filePath: manageFile },
      {
        onSuccess: () => {
          message.success(`"${manageFile}" is now managed under resource "${manageResource}"`);
          onClose();
          setManageFile(undefined);
          setManageResource(undefined);
        },
        onError: (err) => {
          message.error(`Failed to manage: ${err instanceof Error ? err.message : err}`);
        },
      },
    );
  };

  return (
    <Modal
      title={t('ha:manage_ha_configuration')}
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common:cancel')}</Button>
          <Button
            type="primary"
            disabled={!manageFile || !manageResource}
            loading={manageMutation.isPending}
            onClick={handleManageSubmit}
          >
            Manage
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <div>
          <Text strong>Configuration File</Text>
          <Select
            className="w-full mt-1"
            placeholder={t('ha:select_unmanaged_configuration_file')}
            value={manageFile}
            onChange={setManageFile}
            options={unmanagedFiles.map((f) => ({ label: f.path, value: f.path }))}
          />
        </div>
        <div>
          <Text strong>Resource Definition</Text>
          <Select
            className="w-full mt-1"
            placeholder={t('files:select_resource_placeholder')}
            value={manageResource}
            onChange={setManageResource}
            showSearch
            options={allResourceDefinitions.map((name) => ({ label: name, value: name }))}
          />
        </div>
      </div>
    </Modal>
  );
};
