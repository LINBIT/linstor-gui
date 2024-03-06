import { operations, components } from '@app/apis/schema';

export type DeleteStoragePoolRequest = operations['nodeStoragePoolDelete']['parameters']['path'];
export type CreatePhysicalStorageRequestBody = components['schemas']['PhysicalStorageCreate'];

export type CreateStoragePoolRequestPath = operations['nodeStoragePoolCreate']['parameters']['path'];
export type CreateStoragePoolRequestBody = components['schemas']['StoragePool'];

export type ProviderKind = components['schemas']['ProviderKind'];

export type GetStoragePoolQuery = operations['viewStoragePools']['parameters']['query'];
export type UpdateStoragePoolRequestBody = components['schemas']['StoragePoolDefinitionModify'];
export type UpdateStoragePoolRequest = operations['nodeStoragePoolModify']['parameters']['path'];

export type GetStoragePoolRequestQuery = operations['nodeStoragePoolList']['parameters']['query'];
export type StoragePool = components['schemas']['StoragePool'];
