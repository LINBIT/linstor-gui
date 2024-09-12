import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import StoragePoolForm from './components/StoragePoolForm';

import service from '@app/requests';

const StoragePoolCreate: React.FC = () => {
  const [alertList, setAlertList] = useState<alertList>([]);
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
          history.push('/inventory/storage-pools');
        }
      },
    }
  );

  return (
    <PageBasic title="Add Storage Pool" alerts={alertList}>
      <StoragePoolForm handleSubmit={handleAddStoragePool} loading={loading} />
    </PageBasic>
  );
};

export default StoragePoolCreate;
