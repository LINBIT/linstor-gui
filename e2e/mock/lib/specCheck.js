// SPDX-License-Identifier: GPL-3.0
//
// Checks every reply the mock sends against the reply the LINSTOR spec
// declares for it, so a scenario cannot answer in a shape the controller
// never sends and still have its tests pass. A mismatch does not stop the
// reply: it is recorded, and the e2e fixture fails the test that caused it
// (GET /__mock/violations hands them over and starts a fresh list).

import { resolveRef } from './schemaMock.js';

const RC_LIST = { $ref: '#/components/schemas/ApiCallRcList' };
const OPERATION_FAILED = '#/components/responses/OperationFailed';

// Where the spec is wrong about what the controller sends, each checked
// against a real controller:
//  - an error reply is an ApiCallRc list, also where the spec declares
//    OperationFailed (a single ApiCallRc) or no reply for that status;
//  - a refused clone answers 500 with the clone-started object, its
//    messages saying why;
//  - the remote list is one RemoteList object, not an array of them.
const CORRECTIONS = {
  'POST /v1/resource-definitions/{resource}/clone 500': {
    $ref: '#/components/schemas/ResourceDefinitionCloneStarted',
  },
  'GET /v1/remotes 200': { $ref: '#/components/schemas/RemoteList' },
};

// Problems listed per reply; the first few say enough.
const MAX_PROBLEMS = 5;

const typeOf = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
};

const hasType = (type, value) => (type === 'number' ? typeof value === 'number' : typeOf(value) === type);

/**
 * The schema with its $ref resolved and its allOf parts merged, so the
 * properties of every part are known when unknown keys are looked for.
 */
const flatten = (schema, spec) => {
  let s = schema;
  while (s && s.$ref) s = resolveRef(spec, s.$ref);
  if (!s || !s.allOf) return s;
  const merged = { ...s, allOf: undefined, properties: { ...(s.properties ?? {}) }, required: [...(s.required ?? [])] };
  for (const part of s.allOf) {
    const p = flatten(part, spec);
    if (!p) continue;
    if (p.type) merged.type = p.type;
    Object.assign(merged.properties, p.properties ?? {});
    merged.required.push(...(p.required ?? []));
    if (p.additionalProperties !== undefined) merged.additionalProperties = p.additionalProperties;
  }
  return merged;
};

/**
 * Appends to `out` where `value` differs from `schema`. Stricter than JSON
 * Schema in one way: an object whose schema lists its properties may only
 * carry those (unless additionalProperties says otherwise), because the
 * controller sends nothing the spec does not name and the GUI's types know
 * nothing else. oneOf is read as anyOf: the volume layer alternatives
 * overlap.
 */
const check = (schema, value, at, spec, out) => {
  if (out.length >= MAX_PROBLEMS) return;
  const s = flatten(schema, spec);
  if (!s) return;

  const alternatives = s.oneOf ?? s.anyOf;
  if (alternatives) {
    let closest = null;
    for (const alternative of alternatives) {
      const problems = [];
      check(alternative, value, at, spec, problems);
      if (!problems.length) return;
      if (!closest || problems.length < closest.length) closest = problems;
    }
    out.push(`${at}: matches none of its ${alternatives.length} alternatives (closest: ${closest[0]})`);
    return;
  }

  if (s.type && !hasType(s.type, value)) {
    out.push(`${at}: is ${typeOf(value)}, the spec says ${s.type}`);
    return;
  }
  if (s.enum && !s.enum.includes(value)) {
    out.push(`${at}: ${JSON.stringify(value)} is not one of ${JSON.stringify(s.enum)}`);
    return;
  }
  if (typeof value === 'number') {
    if (s.minimum !== undefined && value < s.minimum) out.push(`${at}: ${value} is below ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) out.push(`${at}: ${value} is above ${s.maximum}`);
  }

  if (Array.isArray(value) && s.items) {
    value.forEach((item, i) => check(s.items, item, `${at}[${i}]`, spec, out));
    return;
  }

  if (typeOf(value) === 'object') {
    for (const key of s.required ?? []) {
      if (!(key in value)) out.push(`${at}: lacks "${key}"`);
    }
    const properties = s.properties ?? {};
    for (const [key, item] of Object.entries(value)) {
      if (properties[key]) {
        check(properties[key], item, `${at}.${key}`, spec, out);
      } else if (typeof s.additionalProperties === 'object') {
        check(s.additionalProperties, item, `${at}.${key}`, spec, out);
      } else if (s.properties && s.additionalProperties !== true) {
        out.push(`${at}: has "${key}", which the spec does not name`);
      }
      if (out.length >= MAX_PROBLEMS) return;
    }
  }
};

/** The schema a reply with this status must match where the spec is wrong about it (see CORRECTIONS). */
export const correctedSchema = (route, status) => CORRECTIONS[`${route.method} ${route.pathTemplate} ${status}`];

/** The schema a reply with this status must match; `problem` when there is none it may send. */
const replySchema = (route, status, spec) => {
  const corrected = correctedSchema(route, status);
  if (corrected) return { schema: corrected };
  const responses = route.operation.responses ?? {};
  const declared = responses[String(status)] ?? responses.default;
  if (!declared) {
    return status >= 400 ? { schema: RC_LIST } : { problem: `the spec declares no ${status} reply` };
  }
  if (declared.$ref === OPERATION_FAILED) return { schema: RC_LIST };
  const response = declared.$ref ? resolveRef(spec, declared.$ref) : declared;
  // No JSON body declared (an empty reply, an event stream): nothing to check.
  return { schema: response?.content?.['application/json']?.schema ?? null };
};

export const createReplyChecker = (spec) => {
  // One entry per distinct problem; the GUI polls, so the same one repeats.
  const violations = new Map();

  const record = (where, problem) => {
    const key = `${where}: ${problem}`;
    const seen = violations.get(key);
    if (seen) seen.count += 1;
    else violations.set(key, { where, problem, count: 1 });
  };

  /** Checks a reply to a spec operation. */
  const checkReply = (route, status, body) => {
    const where = `${route.method} ${route.pathTemplate} -> ${status}`;
    const { schema, problem } = replySchema(route, status, spec);
    if (problem) {
      record(where, problem);
      return;
    }
    if (!schema) return;
    let value;
    try {
      value = JSON.parse(body);
    } catch {
      record(where, `the body is not JSON: ${body.slice(0, 80)}`);
      return;
    }
    const problems = [];
    check(schema, value, 'reply', spec, problems);
    problems.forEach((p) => record(where, p));
  };

  /**
   * A request the spec has no operation for. Only the GUI's requests count:
   * the page calls the mock from another port, so the browser sends an
   * Origin. A request without one did not come from the GUI.
   */
  const notInSpec = (req, pathname) => {
    if (req.headers.origin) record(`${req.method} ${pathname}`, 'not in the LINSTOR spec');
  };

  /**
   * Hands the violations over and starts a fresh list, in one step: a reply
   * sent between reading and clearing would otherwise be lost.
   */
  const serve = (req, res) => {
    const body = JSON.stringify([...violations.values()]);
    violations.clear();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
  };

  return { checkReply, notInSpec, serve };
};

/**
 * Calls `onReply(status, body)` once the reply is sent, whoever sends it: the
 * router, or a scenario handler writing `res` itself.
 */
export const watchReply = (res, onReply) => {
  const chunks = [];
  const keep = (chunk) => {
    if (chunk && typeof chunk !== 'function') chunks.push(Buffer.from(chunk));
  };
  const write = res.write.bind(res);
  const end = res.end.bind(res);
  res.write = (chunk, ...rest) => {
    keep(chunk);
    return write(chunk, ...rest);
  };
  res.end = (chunk, ...rest) => {
    keep(chunk);
    onReply(res.statusCode, Buffer.concat(chunks).toString('utf8'));
    return end(chunk, ...rest);
  };
};
