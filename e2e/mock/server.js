#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0
//
// linstor-gui-mock — a tiny LINSTOR REST API stub for running linstor-gui
// against synthetic data. Pick a scenario via MOCK_SCENARIO or --scenario.

import http from 'node:http';
import { URL } from 'node:url';

import { createHandler } from './lib/router.js';

const argv = process.argv.slice(2);
const argScenario = argv.find((a) => a.startsWith('--scenario='))?.slice('--scenario='.length);

const SCENARIO = argScenario || process.env.MOCK_SCENARIO || 'default';
const PORT = Number(process.env.PORT || 3478);
const HOST = process.env.HOST || '127.0.0.1';
const LATENCY_MS = Number(process.env.MOCK_LATENCY_MS || 0);
const VERBOSE = process.env.MOCK_VERBOSE !== '0';

const scenarioModule = await import(`./scenarios/${SCENARIO}.js`).catch((err) => {
  console.error(`\nUnknown scenario "${SCENARIO}". (${err.message})\n`);
  console.error('Available: default, sync, large-scale\n');
  process.exit(1);
});

const scenario = scenarioModule.default;
const handler = createHandler(scenario);

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      if (!VERBOSE) return;
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${url.pathname}${url.search} -> ${res.statusCode} (${ms.toFixed(1)}ms)`);
    });

    const dispatch = () => {
      Promise.resolve(handler(req, res, url)).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('mock handler error', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(String(err && err.stack ? err.stack : err));
        }
      });
    };
    if (LATENCY_MS > 0) setTimeout(dispatch, LATENCY_MS);
    else dispatch();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('mock server error', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(err && err.stack ? err.stack : err));
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `\nlinstor-gui-mock listening on http://${HOST}:${PORT}\n` +
      `  scenario:        ${scenario.name}\n` +
      `  description:     ${scenario.description}\n` +
      `  nodes:           ${scenario.nodes().length}\n` +
      `  resources:       ${scenario.resources().length}\n` +
      `  resource defs:   ${scenario.resourceDefinitions().length}\n` +
      `  storage pools:   ${scenario.storagePools().length}\n` +
      `  injected latency:${LATENCY_MS}ms\n\n` +
      `Point linstor-gui at it:\n  VITE_LINSTOR_API_HOST=http://${HOST}:${PORT} npm run dev\n`,
  );
});
