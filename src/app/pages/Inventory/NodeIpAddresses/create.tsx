import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';

import NodeIpAddressForm from './components/NodeIpAddressForm';
import service from '@app/requests';

const NodeIpAddressCreate: React.FC = () => {
  const [alertList, setAlertList] = useState<alertList>([]);
  const history = useHistory();

  const { loading, run: handleAddIpAddress } = useRequest(
    (node, body) => ({
      url: `/v1/nodes/${node}/net-interfaces`,
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
          history.push('/inventory/ip');
        }
      },
    }
  );

  return (
    <PageBasic title="Add Ip Address" alerts={alertList}>
      <NodeIpAddressForm handleSubmit={handleAddIpAddress} loading={loading} />
    </PageBasic>
  );
};

export default NodeIpAddressCreate;
