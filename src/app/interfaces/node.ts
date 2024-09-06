// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { operations, components } from '@app/apis/schema';

export type NodeType = components['schemas']['Node'];
export type NodeLitResponse = operations['nodeList']['responses']['200']['content']['application/json'];
export type NodeListRequest = operations['nodeList']['parameters']['query'];
export type NodeListStatsResponse = operations['nodeStats']['responses']['200']['content']['application/json'];
export type NodeLostRequest = operations['nodeLost']['parameters']['path'];
export type NodeDeleteRequest = operations['nodeDelete']['parameters']['path'];
export type NodeModifyRequest = operations['nodeModify']['requestBody']['content']['application/json'];

import { NetInterfaceType } from '@app/interfaces/net_interface';

const NodeTypeData = {
  name: 'nodeA',
  type: 'SATELLITE',
  net_interfaces: [
    {
      name: 'default',
      address: '10.0.0.2',
      satellite_port: 3366,
      satellite_encryption_type: 'Plain',
      is_active: true,
    },
  ],
};

export type NodeInfoType = { node: string; ip: string; port: number | string };
export type NodeDTOType = typeof NodeTypeData;
export type TNodeListType = NodeLitResponse;

export type NodeItem = {
  name: string;
  type: string;
  net_interfaces: NetInterfaceType[];
};
