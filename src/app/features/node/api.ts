import { get, post, put } from '@app/features/requests';

import { NodeListQuery, NodeCreateRequestBody, UpdateNetInterfaceRequestBody, UpdateNodeRequestBody } from './types';
import service from '@app/requests';

const getNodes = (query: NodeListQuery) => {
  return get('/v1/nodes', {
    params: {
      query,
    },
  });
};

const getNodesFromVSAN = () => {
  return service.get('/api/frontend/v1/nodes');
};

const setNodeStandBy = (hostname: string, standby: boolean) => {
  return service.post(`/api/frontend/v1/nodes/${hostname}/standby`, {
    standby,
  });
};

const createNode = (body: NodeCreateRequestBody) => {
  return post('/v1/nodes', {
    body,
  });
};

const updateNode = ({ node, body }: { node: string; body: UpdateNodeRequestBody }) => {
  return put('/v1/nodes/{node}', {
    params: {
      path: {
        node,
      },
    },
    body,
  });
};

const getNetworksByNode = (node: string) => {
  return get('/v1/nodes/{node}/net-interfaces', {
    params: {
      path: {
        node,
      },
    },
  });
};

const updateNetwork = ({
  node,
  netinterface,
  body,
}: {
  node: string;
  netinterface: string;
  body: UpdateNetInterfaceRequestBody;
}) => {
  return put('/v1/nodes/{node}/net-interfaces/{netinterface}', {
    params: {
      path: {
        node,
        netinterface,
      },
    },
    body,
  });
};

export { getNodes, getNetworksByNode, createNode, updateNetwork, updateNode, getNodesFromVSAN, setNodeStandBy };
