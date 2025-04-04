// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { del, get, post, put } from '@app/features/requests';
import service from '@app/requests';

import {
  NodeListQuery,
  NodeCreateRequestBody,
  UpdateNetInterfaceRequestBody,
  UpdateNodeRequestBody,
  UpdateControllerBody,
} from './types';

const getNodes = (query: NodeListQuery) => {
  return get('/v1/nodes', {
    params: {
      query,
    },
  });
};

const getControllerConfig = () => {
  return get('/v1/controller/config');
};

const getControllerVersion = () => {
  return get('/v1/controller/version');
};

const getNodeCount = () => {
  return get('/v1/stats/nodes');
};

const getSpaceReport = () => {
  return service.get('/v1/space-report');
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

const getControllerProperties = () => {
  return get('/v1/controller/properties');
};

const updateController = (body: UpdateControllerBody) => {
  return post('/v1/controller/properties', {
    body,
  });
};

const deleteNode = (node: string) => {
  return del('/v1/nodes/{node}', {
    params: {
      path: {
        node,
      },
    },
  });
};

const lostNode = (node: string) => {
  return del('/v1/nodes/{node}/lost', {
    params: {
      path: {
        node,
      },
    },
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

export {
  getNodes,
  getNetworksByNode,
  createNode,
  updateNetwork,
  updateNode,
  getNodeCount,
  deleteNode,
  getControllerConfig,
  getSpaceReport,
  lostNode,
  updateController,
  getControllerProperties,
  getControllerVersion,
};
