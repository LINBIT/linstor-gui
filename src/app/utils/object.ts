// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeProperty = (propKey, { [propKey]: propValue, ...rest }) => rest;

export const omit = (object: Record<string, unknown>, ...keys: string[]): Record<string, unknown> => {
  return keys.length ? omit(removeProperty(keys.pop(), object), ...keys) : object;
};

// KVS only store string value
export const convertToBoolean = (object: Record<string, unknown>): Record<string, boolean> => {
  const res = {};
  for (const iterator in object) {
    if (object[iterator] === 'true') {
      res[iterator] = true;
    }

    if (object[iterator] === 'false') {
      res[iterator] = false;
    }
  }

  return res;
};
