import { get, post, put } from '../requests';
import { CreateNetWorkInterfaceRequestBody, GetNetWorkInterfaceRequestQuery } from './types';

const createNetWorkInterface = async (node: string, body: CreateNetWorkInterfaceRequestBody) => {
  return post('/v1/nodes/{node}/net-interfaces', {
    params: {
      path: {
        node,
      },
    },
    body,
  });
};

const updateNetWorkInterface = async (node: string, body: CreateNetWorkInterfaceRequestBody) => {
  return put('/v1/nodes/{node}/net-interfaces/{netinterface}', {
    params: {
      path: {
        node,
        netinterface: body.name,
      },
    },
    body,
  });
};

const getNetWorkInterfaceByNode = async (node: string, query?: GetNetWorkInterfaceRequestQuery) => {
  return get('/v1/nodes/{node}/net-interfaces', {
    params: {
      path: {
        node,
      },
      query,
    },
  });
};

export { createNetWorkInterface, getNetWorkInterfaceByNode, updateNetWorkInterface };
