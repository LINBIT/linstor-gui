// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { get, put, del } from '../requests';
import { KeyValueStoreModify } from './types';

const getKVStore = () => {
  return get('/v1/key-value-store', {});
};

const getKVInstance = (instance: string) => {
  return get('/v1/key-value-store/{instance}', {
    params: {
      path: {
        instance,
      },
    },
  });
};

const deleteKVInstance = (instance: string) => {
  return del('/v1/key-value-store/{instance}', {
    params: {
      path: {
        instance,
      },
    },
  });
};

const createOrModifyKVInstance = (instance: string, store: KeyValueStoreModify) => {
  return put('/v1/key-value-store/{instance}', {
    params: {
      path: {
        instance,
      },
    },
    body: store,
  });
};

export { getKVStore, getKVInstance, deleteKVInstance, createOrModifyKVInstance };
