// SPDX-License-Identifier: GPL-3.0
//
// Spec-driven LINSTOR REST router. At boot time we walk every path in the
// OpenAPI document and compile a regex per (method, path-template) pair.
// At request time we find the first match and either:
//   - call a scenario-provided override (`scenario.handlers[operationId]`)
//   - or generate a default response from the operation's success schema.
//
// All requests get permissive CORS headers so the GUI's dev server can call
// us cross-origin.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mockFromSchema, pickSuccessResponseSchema } from './schemaMock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPEC_PATH = path.resolve(__dirname, '../spec/rest_v1_openapi.json');

let cachedSpec = null;

const loadSpec = () => {
  if (cachedSpec) return cachedSpec;
  if (!fs.existsSync(SPEC_PATH)) {
    throw new Error(
      `OpenAPI spec missing at ${SPEC_PATH}. Run \`npm run generate-spec\`.`,
    );
  }
  cachedSpec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
  return cachedSpec;
};

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];

const compilePathTemplate = (template) => {
  const paramNames = [];
  const regexSource = template.replace(/\{([^/}]+)\}/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return {
    regex: new RegExp(`^${regexSource}$`),
    paramNames,
  };
};

const compileRoutes = (spec) => {
  const routes = [];
  for (const [pathTemplate, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) continue;
    const compiled = compilePathTemplate(pathTemplate);
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      routes.push({
        method: method.toUpperCase(),
        pathTemplate,
        operationId: op.operationId,
        operation: op,
        regex: compiled.regex,
        paramNames: compiled.paramNames,
      });
    }
  }
  // Sort: more specific (more literal segments) first so /v1/nodes/{node}/foo
  // beats /v1/nodes/{node} on overlapping paths.
  routes.sort((a, b) => {
    const aLits = a.pathTemplate.split('/').filter((p) => !p.startsWith('{')).length;
    const bLits = b.pathTemplate.split('/').filter((p) => !p.startsWith('{')).length;
    return bLits - aLits;
  });
  return routes;
};

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(body);
};

const text = (res, status, contentType, body) => {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
};

const corsPreflight = (res) => {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  });
  res.end();
};

const paginate = (arr, url) => {
  const offset = Number(url.searchParams.get('offset') || 0);
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw == null ? arr.length : Number(limitRaw);
  return arr.slice(offset, offset + limit);
};

const getMulti = (url, key) => {
  const values = url.searchParams.getAll(key);
  if (values.length === 0) return null;
  return new Set(values.flatMap((v) => v.split(',')).filter(Boolean));
};

/**
 * Build the request handler for a scenario.
 *
 * The scenario may expose:
 *   - `handlers`: { [operationId]: (ctx) => any }
 *      ctx = { req, res, params, query, url, route, spec, scenario, helpers }
 *      Return value is sent as JSON. Or call res yourself and return undefined.
 *      Throw to fall through to the spec-driven default.
 *
 *   - any of the legacy data getters used by the built-in scenarios
 *     (nodes(), resources(), etc.). These power generic helpers like
 *     `helpers.respondWith(scenario.nodes(), { paginate: true, query })`.
 */
export const createSpecHandler = (scenario) => {
  const spec = loadSpec();
  const routes = compileRoutes(spec);

  // Pre-compute default response bodies for every operation (single mock
  // generation per boot, not per request).
  const defaultResponses = new Map();
  for (const route of routes) {
    const { schema, status } = pickSuccessResponseSchema(route.operation, spec);
    defaultResponses.set(route, { status, schema });
  }

  const readJsonBody = (req) =>
    new Promise((resolve) => {
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        resolve(null);
        return;
      }
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
        // Cap at ~2 MB to keep things safe.
        if (raw.length > 2_000_000) {
          raw = '';
          req.destroy();
          resolve(null);
        }
      });
      req.on('end', () => {
        if (!raw) return resolve(null);
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(raw);
        }
      });
      req.on('error', () => resolve(null));
    });

  const dispatch = async (req, res, url) => {
    const method = req.method || 'GET';

    if (method === 'OPTIONS') return corsPreflight(res);

    if (url.pathname === '/metrics') {
      return text(
        res,
        200,
        'text/plain; charset=utf-8',
        `# HELP linstor_mock_info\nlinstor_mock_info{version="mock"} 1\n`,
      );
    }
    if (url.pathname === '/v1/space-report') {
      return text(
        res,
        200,
        'text/plain; charset=utf-8',
        `LINSTOR mock space report\n` +
          `Nodes: ${scenario.nodes?.().length ?? 0}\n` +
          `Resources: ${scenario.resources?.().length ?? 0}\n`,
      );
    }

    const route = routes.find((r) => r.method === method && r.regex.test(url.pathname));
    if (!route) {
      // Not in the spec at all. Be generous: return [] under /v1/ for GETs,
      // accept everything else with an OK envelope.
      if (method === 'GET' && url.pathname.startsWith('/v1/')) return json(res, 200, []);
      if (method !== 'GET') return json(res, 200, [{ ret_code: 1, message: 'OK' }]);
      return text(res, 404, 'text/plain; charset=utf-8', `Not found: ${url.pathname}`);
    }

    const match = url.pathname.match(route.regex);
    const params = {};
    route.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });

    const requestBody = await readJsonBody(req);

    const ctx = {
      req,
      res,
      params,
      query: url.searchParams,
      url,
      route,
      scenario,
      spec,
      body: requestBody,
      helpers: {
        paginate: (arr) => paginate(arr, url),
        getMulti: (key) => getMulti(url, key),
      },
    };

    const handler = scenario.handlers?.[route.operationId];

    let body;
    if (handler) {
      try {
        body = handler(ctx);
      } catch (err) {
        // Scenario asked to fall through.
        if (err && err.fallthrough) {
          body = undefined;
        } else {
          throw err;
        }
      }
    }

    if (body === undefined) {
      if (method !== 'GET') {
        // Generic success envelope for any mutation that no scenario handler
        // overrode. Schema-driven defaults would produce ret_code: 0 which the
        // GUI treats as failure.
        body = [{ ret_code: 1, message: 'OK' }];
      } else {
        const fallback = defaultResponses.get(route);
        if (fallback?.schema) {
          body = mockFromSchema(fallback.schema, spec);
        } else if (url.pathname.startsWith('/v1/')) {
          body = [];
        } else {
          body = [{ ret_code: 1, message: 'OK' }];
        }
      }
    }

    // If the handler already responded itself, don't double-send.
    if (res.headersSent) return;

    json(res, defaultResponses.get(route)?.status ?? 200, body);
  };

  return dispatch;
};

/**
 * Convenience: marker error a handler can throw to indicate "I don't want to
 * handle this; fall back to schema defaults".
 */
export const FALLTHROUGH = (() => {
  const e = new Error('fallthrough');
  e.fallthrough = true;
  return e;
})();
