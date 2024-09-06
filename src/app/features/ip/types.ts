// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { components, operations } from '@app/apis/schema';

export type CreateNetWorkInterfaceRequestBody = components['schemas']['NetInterface'];
export type GetNetWorkInterfaceRequestQuery = operations['netinterfaceList']['parameters']['query'];
export type NetWorkInterface = components['schemas']['NetInterface'];
