// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { KeyValueStoreInstance, KeyValueStoreList, KeyValueStoreModify } from './types';
import { getKVStore, getKVInstance, createOrModifyKVInstance, deleteKVInstance } from './api';
import { APICALLRCLIST } from '../requests';

export interface UserAuth {
  username: string;
  password: string;
}

export class KeyValueStore {
  public async list(): Promise<KeyValueStoreList> {
    const response = await getKVStore();
    if (response.data) {
      return response.data;
    } else {
      throw new Error('Failed to list key value stores.');
    }
  }

  // list all keys
  public async listKeys(instance: string): Promise<string[]> {
    const response = await this.get(instance);
    if (response.props) {
      return Object.keys(response.props);
    } else {
      throw new Error(`Failed to list keys of key value store ${instance}`);
    }
  }

  // list all instances
  public async listInstances(): Promise<string[]> {
    const response = await this.list();

    if (response) {
      return response.map((e) => e.name ?? '').filter((e) => e !== '');
    } else {
      throw new Error('Failed to list key value store instances.');
    }
  }

  // check if instance exists
  public async instanceExists(instance: string): Promise<boolean> {
    const response = await this.listInstances();
    return response.includes(instance);
  }

  // create instance
  public async create(instance: string, store?: KeyValueStoreModify): Promise<void> {
    // check if instance exists
    if (await this.instanceExists(instance)) {
      this.modify(instance, {
        ...store,
        override_props: {
          ...store?.override_props,
          __updated__: new Date().toISOString(),
        },
      });
    }

    const response = await createOrModifyKVInstance(instance, {
      ...store,
      override_props: {
        ...store?.override_props,
        __updated__: new Date().toISOString(),
      },
    });
    if (!response.data) {
      throw new Error(`Failed to create key value store ${instance}`);
    }
  }

  public async get(instance: string): Promise<KeyValueStoreInstance> {
    const response = await getKVInstance(instance);
    if (response.data) {
      return response.data[0];
    } else {
      throw new Error(`Failed to get key value store ${instance} `);
    }
  }

  public async modify(instance: string, store: KeyValueStoreModify): Promise<APICALLRCLIST> {
    const response = await createOrModifyKVInstance(instance, {
      ...store,
      override_props: {
        ...store.override_props,
        __updated__: new Date().toISOString(),
      },
    });
    if (response.data) {
      return response.data;
    } else {
      throw new Error(`Failed to modify key value store ${instance}`);
    }
  }

  public async delete(instance: string): Promise<void> {
    const response = await deleteKVInstance(instance);
    if (!response.data) {
      throw new Error(`Failed to delete key value store ${instance}`);
    }
  }

  public async getProperty(instance: string, propertyName: string): Promise<string | undefined> {
    const response = await this.get(instance);
    if (response.props) {
      return response.props[propertyName];
    } else {
      throw new Error(`Failed to get property ${propertyName} of key value store ${instance}`);
    }
  }

  public async setProperty(instance: string, propertyName: string, propertyValue: string): Promise<void> {
    const response = await this.modify(instance, {
      override_props: {
        [propertyName]: propertyValue,
        __updated__: new Date().toISOString(),
      },
    });
    if (!response.every((e) => e.ret_code > 0)) {
      throw new Error(`Failed to set property ${propertyName} of key value store ${instance}`);
    }
  }

  public async deleteProperty(instance: string, propertyName: string): Promise<void> {
    const response = await this.modify(instance, {
      delete_props: [propertyName],
    });

    if (!response.every((e) => e.ret_code > 0)) {
      throw new Error(`Failed to set property ${propertyName} of key value store ${instance}`);
    }
  }
}

export default new KeyValueStore();
