// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const _NetInterface = {
  name: 'default',
  address: '10.10.10.10',
  satellite_port: 3366,
  satellite_encryption_type: 'Plain',
  is_active: true,
};

export type NetInterfaceType = typeof _NetInterface;
