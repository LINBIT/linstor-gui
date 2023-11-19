import { components } from '@app/apis/schema';
import KeyValueStore from './KeyValueStore';

export type KeyValueStoreModify = components['schemas']['KeyValueStoreModify'];
export type KeyValueStoreList = components['schemas']['KeyValueStore'][];
export type KeyValueStoreInstance = components['schemas']['KeyValueStore'];

export type KeyValueStoreType = typeof KeyValueStore;
