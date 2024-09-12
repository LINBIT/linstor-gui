import { Models } from '@rematch/core';
import { nfs } from './nfs';
import { node } from './node';

export interface RootModel extends Models<RootModel> {
  nfs: typeof nfs;
  node: typeof node;
}
export const models: RootModel = { nfs, node };
