// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { windowsAgents } from '../windows_agents';

// windows_agents.ts is generated from these by scripts/generate-windows-agents.mjs.
// Reading the source here keeps the committed file honest without re-running
// the generator: if someone edits the .ts by hand, or adds a JSON and forgets
// to regenerate, this notices.
const JSON_DIR = join(process.cwd(), 'scripts/ocf-windows-agents');

const sourceAgents = readdirSync(JSON_DIR)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => JSON.parse(readFileSync(join(JSON_DIR, file), 'utf8')));

const generated = windowsAgents.providers.linbit;

describe('windows_agents.ts', () => {
  it('has one entry per source JSON, in the same order', () => {
    expect(generated.map((agent) => agent.name)).toEqual(sourceAgents.map((agent) => agent.name));
  });

  it('carries every parameter the source declares', () => {
    generated.forEach((agent, i) => {
      const source = sourceAgents[i];
      expect(agent.parameters.map((p) => p.name)).toEqual(source.parameters.map((p: { name: string }) => p.name));
      agent.parameters.forEach((param, j) => {
        const sourceParam = source.parameters[j];
        expect(param.required).toBe(sourceParam.required);
        expect(param.type).toBe(sourceParam.type);
        expect(param.longdesc).toBe(sourceParam.longdesc);
      });
    });
  });

  it('keeps the actions, including the ones only Windows agents have', () => {
    generated.forEach((agent, i) => {
      expect(agent.actions.map((a) => a.name)).toEqual(sourceAgents[i].actions.map((a: { name: string }) => a.name));
    });

    // migrate_to / node-lost drive live migration and crash failover; the
    // earlier hand-written catalog dropped every action.
    const hyperV = generated.find((agent) => agent.name === 'HyperV');
    expect(hyperV?.actions.map((a) => a.name)).toEqual(
      expect.arrayContaining(['start', 'stop', 'monitor', 'migrate_to', 'node-lost']),
    );
  });

  it('invents nothing the source JSON does not state', () => {
    // No `unique`, no parameter `default` — the generator omits both rather
    // than guessing, and the editor reads `param.default || ''`.
    for (const agent of generated) {
      for (const param of agent.parameters) {
        expect(param).not.toHaveProperty('unique');
        expect(param).not.toHaveProperty('default');
      }
    }
  });

  it('covers the WinDRBD agent set', () => {
    expect(generated.map((agent) => agent.name).sort()).toEqual([
      'DRBD',
      'Filesystem',
      'HyperV',
      'guard',
      'ipaddr2-windows',
      'mssql_server_attach_database',
      'windows_service',
      'windows_share',
    ]);
  });
});
