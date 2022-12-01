import React from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import StoragePoolForm from './components/StoragePoolForm';

import service from '@app/requests';
import { notifyList } from '@app/utils/toast';
import { createPhysicalStoragePool } from '@app/services';

const StoragePoolCreate: React.FC = () => {
  const history = useHistory();

  const handleAddStoragePool = async ({ pool_name, node, provider_kind, device_path }) => {
    const { data } = await createPhysicalStoragePool({
      pool_name: 'LinstorStorage',
      node,
      provider_kind,
      device_paths: [device_path],
      with_storage_pool: {
        name: pool_name,
      },
    });
    notifyList(data);
    history.push('/inventory/storage-pools');
  };

  return (
    <PageBasic title="Add Storage Pool">
      <StoragePoolForm handleSubmit={handleAddStoragePool} />
    </PageBasic>
  );
};

export default StoragePoolCreate;
