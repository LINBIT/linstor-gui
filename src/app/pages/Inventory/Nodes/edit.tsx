import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';

import PageBasic from '@app/components/PageBasic';
import NodeForm from './components/NodeForm';
import { NetInterfaceType, NodeInfoType } from '@app/interfaces/node';
import service from '@app/requests';
import { notify, notifyList } from '@app/utils/toast';

const NodeEdit: React.FC = () => {
  const { node } = useParams() as { node: string };
  const { data, loading, error } = useRequest(`/v1/nodes/${node}/net-interfaces`);
  const history = useHistory();

  const { loading: editing, run } = useRequest(
    (nodeName, networkName, body) => ({
      url: `/v1/nodes/${nodeName}/net-interfaces/${networkName}`,
      body,
    }),
    {
      manual: true,
      requestMethod: (param) => {
        return service.put(param.url, param.body).catch((errorArray) => {
          if (errorArray) {
            notifyList(errorArray);
          }
        });
      },
      onSuccess: (data) => {
        if (data) {
          notify('Success', {
            type: 'success',
          });
          setTimeout(() => {
            history.goBack();
          }, 1000);
        }
      },
    }
  );

  const handleEditNode = async (node: NodeInfoType) => {
    const originalData: NetInterfaceType[0] = data.find((e: NetInterfaceType[0]) => e.is_active);
    console.log(node, 'node');
    const nodeDTO = {
      ...originalData,
      address: node.ip,
      satellite_port: node.port,
    };

    await run(node.node, originalData.name, nodeDTO);
  };

  // FIXME: remove loading and error state
  const initialVal =
    !loading && !error
      ? { node, ip: data[0]?.address, port: data[0]?.satellite_port }
      : { node: '', ip: '', port: '3306' };

  return (
    <PageBasic title="Edit Node" loading={loading} error={error}>
      <NodeForm initialVal={initialVal} handleSubmit={handleEditNode} loading={editing} editing={true} />
    </PageBasic>
  );
};

export default NodeEdit;
