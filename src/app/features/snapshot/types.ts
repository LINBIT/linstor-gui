import { components, operations } from '@app/apis/schema';

export type CreateSnapshotRequestBody = components['schemas']['Snapshot'];
export type ResourceListQuery = operations['viewResources']['parameters']['query'];
export type SnapshotListQuery = operations['viewSnapshots']['parameters']['query'];
export type SnapshotType = components['schemas']['Snapshot'];
