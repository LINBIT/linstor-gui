import { get, post, put } from '@app/features/requests';

import { NodeListQuery, NodeCreateRequestBody, UpdateNetInterfaceRequestBody, UpdateNodeRequestBody } from './types';

const getNodes = async (query: NodeListQuery) => {
  return get('/v1/nodes', {
    params: {
      query,
    },
  });
};

const createNode = async (body: NodeCreateRequestBody) => {
  return post('/v1/nodes', {
    body,
  });
};

const updateNode = async ({ node, body }: { node: string; body: UpdateNodeRequestBody }) => {
  return put('/v1/nodes/{node}', {
    params: {
      path: {
        node,
      },
    },
    body,
  });
};

const getNetworksByNode = async (node: string) => {
  return get('/v1/nodes/{node}/net-interfaces', {
    params: {
      path: {
        node,
      },
    },
  });
};

const updateNetwork = async ({
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

export { getNodes, getNetworksByNode, createNode, updateNetwork, updateNode };
