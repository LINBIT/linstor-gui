import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import NodeForm from './components/NodeForm';
import service from '@app/requests';

import { NodeInfoType, NodeDTOType } from '@app/interfaces/node';
import { useTranslation } from 'react-i18next';

const NodeCreate: React.FC = () => {
  const history = useHistory();
  const [alertList, setAlertList] = useState<alertList>([]);
  const { t } = useTranslation('node');

  const { loading, run } = useRequest(
    (data) => {
      return { url: '/v1/nodes', body: data };
    },
    {
      manual: true,
      throwOnError: true,
      requestMethod: (param) => {
        return service.post(param.url, param.body).catch((errorArray) => {
          if (errorArray) {
            console.log(errorArray, '?');
            setAlertList(
              errorArray.map((e) => ({
                variant: 'danger',
                key: (e.ret_code + new Date()).toString(),
                title: e.message,
                show: true,
              }))
            );
          }
        });
      },
      onSuccess: (data) => {
        if (data) {
          setAlertList([
            {
              title: 'Success',
              variant: 'success',
              key: new Date().toString(),
            },
          ]);
          setTimeout(() => {
            history.push('/inventory/nodes');
          }, 1000);
        }
      },
    }
  );

  const handleAddNode = async (node: NodeInfoType) => {
    const nodeDTO: NodeDTOType = {
      name: node.node,
      type: 'SATELLITE',
      net_interfaces: [
        {
          name: 'default',
          address: node.ip,
          satellite_port: Number(node.port),
          satellite_encryption_type: 'Plain',
          is_active: true,
        },
      ],
    };

    await run(nodeDTO);
  };

  return (
    <PageBasic title={t('create_node')} alerts={alertList}>
      <NodeForm handleSubmit={handleAddNode} loading={loading} />
    </PageBasic>
  );
};

export { NodeCreate };
