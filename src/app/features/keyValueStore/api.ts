import { get, put, del } from '../requests';
import { KeyValueStoreModify } from './types';

const getKVStore = async () => {
  return get('/v1/key-value-store', {});
};

const getKVInstance = async (instance: string) => {
  return get('/v1/key-value-store/{instance}', {
    params: {
      path: {
        instance,
      },
    },
  });
};

const deleteKVInstance = async (instance: string) => {
  return del('/v1/key-value-store/{instance}', {
    params: {
      path: {
        instance,
      },
    },
  });
};

const createOrModifyKVInstance = async (instance: string, store: KeyValueStoreModify) => {
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
