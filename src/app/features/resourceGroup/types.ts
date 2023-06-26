import { operations, components } from '@app/apis/schema';

export type ResourceGroupQuery = operations['resourceGroupList']['parameters']['query'];
export type ResourceGroupCreateRequestBody = components['schemas']['ResourceGroup'];
export type ResourceGroupModifyRequestBody = components['schemas']['ResourceGroupModify'];
export type AddVolumeRequestBody = components['schemas']['VolumeGroup'];
