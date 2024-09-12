import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import StoragePoolForm from './components/StoragePoolForm';
import service from '@app/requests';

const StoragePoolEdit: React.FC = () => {
  const { node, storagePool } = useParams() as { node: string; storagePool: string };
  const [alertList, setAlertList] = useState<alertList>();
  const { data = [], loading, error } = useRequest(`/v1/nodes/${node}/storage-pools`);
  const history = useHistory();

  const { loading: editing, run: handleStoragePoolEdit } = useRequest(
    (nodeName, storagePool, body) => ({
      url: `/v1/nodes/${nodeName}/storage-pools/${storagePool}`,
      method: 'put',
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service.put(param.url, param.body).catch((errorArray) => {
          if (errorArray) {
            setAlertList(
              errorArray.map((e) => ({
                variant: e.ret_code > 0 ? 'success' : 'danger',
                key: (e.ret_code + new Date()).toString(),
                title: e.message,
              }))
            );
          }
        });
      },
      onSuccess: (data) => {
        if (data) {
          setTimeout(() => {
            history.push('/inventory/storage-pools');
          }, 1000);
        }
      },
    }
  );

  const handleEditStoragePool = async (node, storagePool) => {
    console.log(node, 'node');
    console.log(storagePool, 'storagePool');
    await handleStoragePoolEdit(node, storagePool.storage_pool_name, {
      delete_namespaces: [],
      delete_props: [],
      override_props: {
        PrefNic: storagePool.props['PrefNic'],
      },
    });
  };

  const originalData = data.find((e) => e.storage_pool_name === storagePool);

  console.log(originalData, 'originalData');

  // FIXME: remove loading and error state
  const initialVal =
    !loading && !error
      ? {
          name: originalData?.storage_pool_name,
          node: originalData?.node_name,
          type: originalData?.provider_kind,
          network_preference: originalData?.props?.PrefNic,
          storage_driver_name: originalData?.props?.['StorDriver/StorPoolName'],
        }
      : {
          name: '',
          node: '',
          type: '',
          network_preference: '',
          storage_driver_name: '',
        };

  return (
    <PageBasic title="Edit Storage Pool" loading={loading} error={error} alerts={alertList}>
      <StoragePoolForm initialVal={initialVal} handleSubmit={handleEditStoragePool} loading={editing} editing />
    </PageBasic>
  );
};

export default StoragePoolEdit;
