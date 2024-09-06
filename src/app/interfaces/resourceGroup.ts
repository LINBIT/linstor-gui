// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const listResData = [
  {
    name: 'rscgrp1',
    description: '',
    props: {
      additionalProp1: 'string',
      additionalProp2: 'string',
      additionalProp3: 'string',
    },
    select_filter: {
      place_count: 0,
      additional_place_count: 0,
      node_name_list: ['string'],
      storage_pool: 'string',
      storage_pool_list: null,
      storage_pool_diskless_list: null,
      not_place_with_rsc: null,
      not_place_with_rsc_regex: 'string',
      replicas_on_same: null,
      replicas_on_different: null,
      layer_stack: null,
      provider_list: null,
      diskless_on_remaining: true,
      diskless_type: 'string',
    },
    uuid: 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb',
  },
];

export type TRGList = typeof listResData;
