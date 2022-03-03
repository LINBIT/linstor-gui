import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { NodeInfoType } from '@app/interfaces/node';
import { Dispatch, RootState } from '@app/store';

import NodeForm from './components/NodeForm';

// for creating node
const NodeCreate: React.FC = () => {
  const { t } = useTranslation('node');
  const dispatch = useDispatch<Dispatch>();
  const history = useHistory();

  // get loading state and alerts from Redux
  const { creating, toast } = useSelector((state: RootState) => ({
    creating: state.loading.effects.node.createNode,
    toast: state.notification.toast || [],
  }));

  // add node
  const handleAddNode = useCallback(
    async (node: NodeInfoType) => {
      const success = await dispatch.node.createNode(node);

      if (success) {
        history.push('/inventory/nodes');
      }
    },
    [dispatch.node, history]
  );

  return (
    <PageBasic title={t('create_node')} alerts={toast}>
      <NodeForm handleSubmit={handleAddNode} loading={creating} />
    </PageBasic>
  );
};

export default NodeCreate;
