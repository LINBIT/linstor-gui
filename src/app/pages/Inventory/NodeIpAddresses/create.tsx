import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';

import NodeIpAddressForm from './components/NodeIpAddressForm';
import service from '@app/requests';
import { notifyList } from '@app/utils/toast';

const NodeIpAddressCreate: React.FC = () => {
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
            notifyList(errorArray);
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
    <PageBasic title="Add Ip Address">
      <NodeIpAddressForm handleSubmit={handleAddIpAddress} loading={loading} />
    </PageBasic>
  );
};

export default NodeIpAddressCreate;
