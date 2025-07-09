// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

interface GenericObject {
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeProperty = (propKey: string, { [propKey]: propValue, ...rest }: GenericObject): GenericObject => rest;

export const omit = (object: Record<string, unknown>, ...keys: string[]): Record<string, unknown> => {
  if (!keys.length) return object;
  const key = keys.pop();
  if (key === undefined) return object;
  return omit(removeProperty(key, object), ...keys);
};

// KVS only store string value
export const convertToBoolean = (object: Record<string, unknown>): Record<string, boolean | string> => {
  const res: Record<string, boolean | string> = {};
  for (const iterator in object) {
    if (object[iterator] === 'true') {
      res[iterator] = true;
    } else if (object[iterator] === 'false') {
      res[iterator] = false;
    } else {
      res[iterator] = object[iterator] as string;
    }
  }

  return res;
};
