import { Models } from '@rematch/core';
import { nfs } from './nfs';
import { node } from './node';
import { setting } from './setting';

export interface RootModel extends Models<RootModel> {
  nfs: typeof nfs;
  node: typeof node;
  setting: typeof setting;
}

export const models: RootModel = { nfs, node, setting };
