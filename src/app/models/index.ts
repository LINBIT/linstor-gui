import { Models } from '@rematch/core';
import { nfs } from './nfs';
import { node } from './node';
import { setting } from './setting';
import { notification } from './notification';

export interface RootModel extends Models<RootModel> {
  nfs: typeof nfs;
  node: typeof node;
  setting: typeof setting;
  notification: typeof notification;
}

export const models: RootModel = { nfs, node, setting, notification };
