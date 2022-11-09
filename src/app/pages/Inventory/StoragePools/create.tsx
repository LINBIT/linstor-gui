import React from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import StoragePoolForm from './components/StoragePoolForm';

import service from '@app/requests';
import { notifyList } from '@app/utils/toast';

const StoragePoolCreate: React.FC = () => {
  const history = useHistory();

  const { loading, run: handleAddStoragePool } = useRequest(
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

  return (
    <PageBasic title="Add Storage Pool">
      <StoragePoolForm handleSubmit={handleAddStoragePool} loading={loading} />
    </PageBasic>
  );
};

export default StoragePoolCreate;
