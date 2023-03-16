import React from 'react';
import { useHistory } from 'react-router-dom';

import PageBasic from '@app/components/PageBasic';
import StoragePoolForm from './components/StoragePoolForm';

import { notifyList } from '@app/utils/toast';
import { createPhysicalStoragePool } from '@app/services';
import { useRequest } from 'ahooks';
import service from '@app/requests';

const StoragePoolCreate: React.FC = () => {
  const history = useHistory();

  const { loading, run: handleAddStoragePoolRegular } = useRequest(
    (node, body) => ({
      url: `/v1/nodes/${node}/storage-pools`,
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service.post(param.url, param.body).catch((errorArray) => {
          if (errorArray) {
            notifyList(errorArray);
          }
        });
      },
      onSuccess: (data) => {
        if (data) {
          history.push('/inventory/storage-pools');
        }
      },
    }
  );

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

  const handleSubmitData = (data) => {
    const { createType, ...rest } = data;
    if (createType === 'regular') {
      handleAddStoragePoolRegular(rest.node, rest);
    } else {
      handleAddStoragePool(rest);
    }
  };

  return (
    <PageBasic title="Add Storage Pool">
      <StoragePoolForm handleSubmit={handleSubmitData} loading={loading} />
    </PageBasic>
  );
};

export default StoragePoolCreate;
