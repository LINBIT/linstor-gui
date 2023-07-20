import { components, operations } from '@app/apis/schema';

export type CreateSnapshotRequestBody = components['schemas']['Snapshot'];
export type ResourceListQuery = operations['viewResources']['parameters']['query'];
