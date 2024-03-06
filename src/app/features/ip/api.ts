import { get, post, put, del } from '../requests';
import { CreateNetWorkInterfaceRequestBody, GetNetWorkInterfaceRequestQuery } from './types';

const createNetWorkInterface = (node: string, body: CreateNetWorkInterfaceRequestBody) => {
  return post('/v1/nodes/{node}/net-interfaces', {
    params: {
      path: {
        node,
      },
    },
    body,
  });
};

const updateNetWorkInterface = (node: string, body: CreateNetWorkInterfaceRequestBody) => {
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

const deleteNetWorkInterface = (node: string, netinterface: string) => {
  return del('/v1/nodes/{node}/net-interfaces/{netinterface}', {
    params: {
      path: {
        node,
        netinterface,
      },
    },
  });
};

const getNetWorkInterfaceByNode = (node: string, query?: GetNetWorkInterfaceRequestQuery) => {
  return get('/v1/nodes/{node}/net-interfaces', {
    params: {
      path: {
        node,
      },
      query,
    },
  });
};

export { createNetWorkInterface, getNetWorkInterfaceByNode, updateNetWorkInterface, deleteNetWorkInterface };
