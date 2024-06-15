import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Input, Modal } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { ResourceMigrateForm, resourceMigration } from '@app/features/resource';
import { List as ListV2 } from '@app/features/resource/components';
import { useDispatch } from 'react-redux';

const List: React.FunctionComponent = () => {
  const { t } = useTranslation(['resource', 'common']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<string>();
  const [snapshotName, setSnapshotName] = useState<string>('');
  const [migrationInfo, setMigrationInfo] = useState<{
    resource: string;
    node: string;
  }>({
    resource: '',
    node: '',
  });

  const dispatch = useDispatch();

  const migrateResourceMutation = useMutation({
    mutationFn: resourceMigration,
  });

  const handleCreateSnapShot = async () => {
    if (currentResource && snapshotName != '') {
      await dispatch.snapshot.createSnapshot({ resource: currentResource, name: snapshotName });
      setIsModalOpen(false);
      setSnapshotName('');
    }
  };

  const handleOpenMigrate = (resource: string, node: string) => {
    setMigrateModalOpen(true);
    setMigrationInfo({ resource, node });
  };

  const handleSnapshot = (resource: string) => {
    setIsModalOpen(true);
    setCurrentResource(resource);
  };

  const handleMigrate = async (val: { node: string }) => {
    const res = await migrateResourceMutation.mutateAsync({
      resource: migrationInfo.resource,
      fromnode: migrationInfo.node,
      node: val.node,
    });

    if (res.data) {
      setMigrateModalOpen(false);
    }
  };

  return (
    <PageBasic title={t('list')}>
      <ListV2 handleOpenMigrate={handleOpenMigrate} handleSnapshot={handleSnapshot} />
      <Modal
        title="Create Snapshot"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateSnapShot}
      >
        <Input
          type="text"
          placeholder="Please input snapshot name here..."
          value={snapshotName}
          onChange={(evt) => {
            setSnapshotName(evt.target.value);
          }}
        />
      </Modal>
      <ResourceMigrateForm
        open={migrateModalOpen}
        migrationInfo={migrationInfo}
        onCancel={() => {
          setMigrateModalOpen(false);
        }}
        onCreate={handleMigrate}
      />
    </PageBasic>
  );
};

export default List;
