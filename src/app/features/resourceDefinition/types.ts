import { components, operations } from '@app/apis/schema';

export type CreateResourceDefinitionRequestBody = components['schemas']['ResourceDefinitionCreate'];
export type CreateVolumeDefinitionRequestBody = components['schemas']['VolumeDefinitionCreate'];
export type AutoPlaceRequestBody = components['schemas']['AutoPlaceRequest'];
export type ResourceDefinitionListQuery = operations['resourceDefinitionList']['parameters']['query'];
export type ResourceDefinition = components['schemas']['ResourceDefinition'];
export type VolumeDefinition = components['schemas']['VolumeDefinition'];
