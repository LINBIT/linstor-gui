// SPDX-License-Identifier: GPL-3.0
//
// Generate plausible mock data from an OpenAPI schema. Honours `example`,
// `default`, `enum`, `oneOf/anyOf/allOf`, and `$ref` lookups. Cycles are cut
// off via a depth limit.

const DEFAULT_DEPTH = 6;
const DEFAULT_ARRAY_SIZE = 1;

const resolveRef = (spec, ref) => {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cursor = spec;
  for (const part of parts) {
    if (cursor == null) return null;
    cursor = cursor[part];
  }
  return cursor;
};

const mergeAllOf = (schemas, spec, depth, seen) => {
  const merged = { type: 'object', properties: {}, required: [] };
  for (const s of schemas) {
    const resolved = s.$ref ? resolveRef(spec, s.$ref) : s;
    if (!resolved) continue;
    if (resolved.type) merged.type = resolved.type;
    if (resolved.properties) Object.assign(merged.properties, resolved.properties);
    if (Array.isArray(resolved.required)) merged.required.push(...resolved.required);
    if (resolved.allOf) {
      const sub = mergeAllOf(resolved.allOf, spec, depth, seen);
      Object.assign(merged.properties, sub.properties);
      merged.required.push(...(sub.required ?? []));
    }
  }
  return merged;
};

/**
 * Build a mock value for the given schema.
 *
 * @param {object} schema
 * @param {object} spec   - the full OpenAPI document (for $ref lookups)
 * @param {object} [opts]
 * @param {number} [opts.depth]       max recursion depth (default 6)
 * @param {number} [opts.arraySize]   default array length when generating (default 1)
 * @param {Set<string>} [opts.seen]   refs in progress (cycle detection)
 */
export const mockFromSchema = (schema, spec, opts = {}) => {
  const { depth = DEFAULT_DEPTH, arraySize = DEFAULT_ARRAY_SIZE, seen = new Set() } = opts;
  if (!schema || depth < 0) return null;

  if (schema.$ref) {
    if (seen.has(schema.$ref)) return null;
    const resolved = resolveRef(spec, schema.$ref);
    if (!resolved) return null;
    return mockFromSchema(resolved, spec, {
      depth,
      arraySize,
      seen: new Set([...seen, schema.$ref]),
    });
  }

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  if (Array.isArray(schema.allOf)) {
    const merged = mergeAllOf(schema.allOf, spec, depth, seen);
    return mockFromSchema(merged, spec, { depth: depth - 1, arraySize, seen });
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return mockFromSchema(schema.oneOf[0], spec, { depth: depth - 1, arraySize, seen });
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return mockFromSchema(schema.anyOf[0], spec, { depth: depth - 1, arraySize, seen });
  }

  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return '2026-01-01T00:00:00Z';
      if (schema.format === 'date') return '2026-01-01';
      if (schema.format === 'uuid') return 'e8ef8d6b-17bc-42f0-9367-4aae40c78ecb';
      if (schema.format === 'binary') return '';
      return 'mock';
    case 'integer':
    case 'number':
      if (typeof schema.minimum === 'number') return schema.minimum;
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'array': {
      if (depth <= 0 || !schema.items) return [];
      const items = [];
      for (let i = 0; i < arraySize; i += 1) {
        items.push(mockFromSchema(schema.items, spec, { depth: depth - 1, arraySize, seen }));
      }
      return items;
    }
    case 'object':
    default: {
      const result = {};
      const props = schema.properties ?? {};
      for (const [key, propSchema] of Object.entries(props)) {
        result[key] = mockFromSchema(propSchema, spec, { depth: depth - 1, arraySize, seen });
      }
      // additionalProperties is rare in this spec for the data we care about;
      // skip generating extras to keep payloads compact.
      return result;
    }
  }
};

/**
 * Pick the response body schema for a successful call. Tries 200, then 201,
 * then any 2xx, then `default`. Falls back to {} when nothing applies.
 */
export const pickSuccessResponseSchema = (operation, spec) => {
  if (!operation || typeof operation !== 'object') return null;
  const responses = operation.responses ?? {};
  const order = ['200', '201', '202', '204', 'default'];
  let chosenStatus = null;
  for (const code of order) {
    if (responses[code]) {
      chosenStatus = code;
      break;
    }
  }
  if (!chosenStatus) {
    const twoXX = Object.keys(responses).find((c) => /^2\d\d$/.test(c));
    chosenStatus = twoXX ?? Object.keys(responses)[0];
  }
  if (!chosenStatus) return { schema: null, status: 200 };

  const response = responses[chosenStatus];
  const resolved = response?.$ref ? resolveRef(spec, response.$ref) : response;
  const content = resolved?.content ?? {};
  const json = content['application/json'] ?? content['*/*'];
  const schema = json?.schema ?? null;

  return {
    schema,
    status: chosenStatus === 'default' ? 200 : Number(chosenStatus),
  };
};
