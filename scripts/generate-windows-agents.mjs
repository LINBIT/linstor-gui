#!/usr/bin/env node
// generate-windows-agents.mjs
//
// Builds src/app/components/OcfAgentEditor/windows_agents.ts from the metadata
// JSON that ocf-resource-agents-rust emits (`make json-files`). Pure Node, no
// dependencies, and the counterpart to generate-ocf-agents.mjs, which does the
// same job for the Linux catalog.
//
// The JSONs are committed under scripts/ocf-windows-agents/ so regenerating is
// reproducible without a checkout of ocf-resource-agents-rust. To refresh them,
// drop a new `make json-files` output in there and re-run this.
//
// Source shape (one file per agent):
//   { "name", "shortdesc", "longdesc",
//     "parameters": [ { "name", "required", "type", "shortdesc", "longdesc" } ],
//     "actions":    [ { "name", "timeout", "interval", "depth" } ] }
//
// Output shape matches the Linux catalog's `ResourceAgentsByProvider`, so both
// feed agentCatalog.ts unchanged.
//
// Fields the source does not carry are omitted rather than invented: the JSON
// has no `unique` and no parameter `default`, so neither is emitted. The editor
// reads `param.default || ''`, so their absence is not a problem.
//
// Usage:
//   node scripts/generate-windows-agents.mjs
//   node scripts/generate-windows-agents.mjs --check    # verify, do not write
//   node scripts/generate-windows-agents.mjs --json-dir DIR --out FILE
//   node scripts/generate-windows-agents.mjs --provider linbit

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const DEFAULTS = {
  jsonDir: join(HERE, 'ocf-windows-agents'),
  out: join(REPO, 'src/app/components/OcfAgentEditor/windows_agents.ts'),
  // The WinDRBD agents ship under the linbit provider, i.e. ocf:linbit:HyperV.
  provider: 'linbit',
};

function parseArgs(argv) {
  const options = { ...DEFAULTS, check: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--json-dir') options.jsonDir = resolve(argv[++i]);
    else if (arg === '--out') options.out = resolve(argv[++i]);
    else if (arg === '--provider') options.provider = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 29).join('\n'));
      process.exit(0);
    } else {
      console.error(`unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

/** Keep only the keys the source actually provides, in a stable order. */
function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) out[key] = source[key];
  }
  return out;
}

function readAgents(jsonDir) {
  const files = readdirSync(jsonDir)
    .filter((file) => file.endsWith('.json'))
    .sort();
  if (files.length === 0) throw new Error(`no .json files in ${jsonDir}`);

  return files.map((file) => {
    let raw;
    try {
      raw = JSON.parse(readFileSync(join(jsonDir, file), 'utf8'));
    } catch (err) {
      throw new Error(`${file}: not valid JSON — ${err.message}`);
    }
    if (!raw.name) throw new Error(`${file}: missing "name"`);

    return {
      ...pick(raw, ['name', 'version', 'shortdesc', 'longdesc']),
      parameters: (raw.parameters ?? []).map((param) => {
        if (!param.name) throw new Error(`${file}: a parameter has no "name"`);
        return pick(param, ['name', 'unique', 'required', 'shortdesc', 'longdesc', 'type', 'default']);
      }),
      actions: (raw.actions ?? []).map((action) => pick(action, ['name', 'timeout', 'interval', 'depth'])),
    };
  });
}

/** Run the emitted source through the repo's prettier config, so the committed
 *  file matches `npm run format` and --check can compare it byte for byte.
 *  Falls back to the raw output if prettier is not installed — still valid TS. */
async function format(source, filepath) {
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(filepath)) ?? {};
    return await prettier.format(source, { ...config, filepath });
  } catch {
    return source;
  }
}

/** Emit as TS source. JSON.stringify gives valid TS object literals; prettier
 *  then puts them in house style. */
function render(agents, provider, jsonDir) {
  const doc = { providers: { [provider]: agents } };
  const relative = jsonDir.startsWith(REPO) ? jsonDir.slice(REPO.length + 1) : jsonDir;
  return (
    `// GENERATED FILE — do not edit by hand.\n` +
    `// Regenerate with: node scripts/generate-windows-agents.mjs\n` +
    `// Source: ${relative}/*.json, produced by ocf-resource-agents-rust 'make json-files'.\n` +
    `//\n` +
    `// The source JSON carries no 'unique' flag and no parameter defaults, so\n` +
    `// neither appears here.\n` +
    `export const windowsAgents = ${JSON.stringify(doc, null, 2)} as const;\n`
  );
}

const options = parseArgs(process.argv.slice(2));
const agents = readAgents(options.jsonDir);
const rendered = await format(render(agents, options.provider, options.jsonDir), options.out);

if (options.check) {
  let current = '';
  try {
    current = readFileSync(options.out, 'utf8');
  } catch {
    console.error(`${options.out} does not exist — run without --check`);
    process.exit(1);
  }
  if (current !== rendered) {
    console.error(`${options.out} is out of date — run: node scripts/generate-windows-agents.mjs`);
    process.exit(1);
  }
  console.log(`${options.out} is up to date (${agents.length} agents)`);
} else {
  writeFileSync(options.out, rendered);
  const params = agents.reduce((n, a) => n + a.parameters.length, 0);
  const actions = agents.reduce((n, a) => n + a.actions.length, 0);
  console.log(`wrote ${options.out}`);
  console.log(`  ${agents.length} agents, ${params} parameters, ${actions} actions (provider: ${options.provider})`);
}
