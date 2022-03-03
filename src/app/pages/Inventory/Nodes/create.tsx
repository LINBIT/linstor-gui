import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import service from '@app/requests';
import { NodeInfoType } from '@app/interfaces/node';
import { Dispatch, RootState } from '@app/store';

import NodeForm from './components/NodeForm';

// For creating node
const NodeCreate: React.FC = () => {
  const history = useHistory();
  const [alertList, setAlertList] = useState<alertList>([]);
  const { t } = useTranslation('node');
  const dispatch = useDispatch<Dispatch>();

  const { creating, alerts } = useSelector((state: RootState) => ({
    creating: state.loading.effects.node.createNode,
    alerts: state.node.alerts,
  }));

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

  // Add Node
  const handleAddNode = useCallback(
    (node: NodeInfoType) => {
      dispatch.node.createNode(node);
    },
    [dispatch.node]
  );

  return (
    <PageBasic title={t('create_node')} alerts={alerts}>
      <NodeForm handleSubmit={handleAddNode} loading={creating} />
    </PageBasic>
  );
};

export { NodeCreate };
