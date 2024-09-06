// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components, operations } from '@app/apis/schema';

export type NodeDataType = components['schemas']['Node'];
export type NodeCreateRequestBody = components['schemas']['Node'];
export type NodeListQuery = operations['nodeList']['parameters']['query'];
export type NodeType = 'Controller' | 'Satellite' | 'Combined' | 'Auxiliary' | 'Openflex_Target';
export type NetInterfaceEncryptionType = 'PLAIN' | 'SSL' | undefined;
export type UpdateNetInterfaceRequestBody = components['schemas']['NetInterface'];
export type UpdateNodeRequestBody = components['schemas']['NodeModify'];
export type UpdateControllerBody = components['schemas']['ControllerPropsModify'];
export type ControllerProperties = components['schemas']['Properties'];
