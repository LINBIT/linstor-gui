import { operations } from '@app/apis/schema';

export type physicalStorageList = operations['getPhysicalStorage']['responses']['200']['content']['application/json'];
export type storagePoolList = operations['viewStoragePools']['responses']['200']['content']['application/json'];
