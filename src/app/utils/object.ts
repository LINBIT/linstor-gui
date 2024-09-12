// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeProperty = (propKey, { [propKey]: propValue, ...rest }) => rest;

export const omit = (object: Record<string, unknown>, ...keys: string[]): Record<string, unknown> => {
  return keys.length ? omit(removeProperty(keys.pop(), object), ...keys) : object;
};
