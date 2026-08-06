#!/usr/bin/env node
// generate-windows-agents.mjs
//
// Builds src/app/components/OcfAgentEditor/windows_agents.ts from the SOURCE of
// ocf-resource-agents-rust, the WinDRBD agents. Pure Node, ZERO npm
// dependencies beyond the repo's own prettier, and the counterpart to
// generate-ocf-agents.mjs, which does the same for the Linux catalog.
//
// Like that one it clones and parses; it does not build or run anything. The
// repo's `make json-files` would also produce metadata, but it needs a Rust
// toolchain and a cargo build to get at something that is already sitting in
// the source as a literal:
//
//     fn meta_data(&self) -> Result<OcfStatus, OcfError> {
//         println!(r#"<?xml version="1.0"?>
//     <resource-agent name="ipaddr2-windows" version="1.0">
//       <parameter name="ip" unique="0" required="1">
//     ...
//
// So a CI runner needs only git and node here too, and both generators share
// their XML handling (scripts/lib/ocf-xml.mjs) — one editor, one shape.
//
// Reading the XML rather than the repo's ocf2json.py output also keeps
// `unique` and parameter `default`, which that conversion drops.
//
// Usage:
//   node scripts/generate-windows-agents.mjs
//   node scripts/generate-windows-agents.mjs --check      # verify, do not write
//   node scripts/generate-windows-agents.mjs --src DIR    # existing checkout
//
//     --repo <url>     Repo URL      (default: LINBIT ocf-resource-agents-rust)
//     --ref <ref>      Branch or tag (default: the repo's default branch)
//     --src <dir>      Use an existing checkout instead of cloning
//     --out <file>     Output file
//     --provider <p>   Provider name in the output (default: linbit)
//     --keep           Do not delete the temp clone

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseXml, toResourceAgent } from './lib/ocf-xml.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const DEFAULTS = {
  repo: 'https://gitlab.at.linbit.com/drbd/ocf-resource-agents-rust.git',
  ref: null,
  src: null,
  out: join(REPO, 'src/app/components/OcfAgentEditor/windows_agents.ts'),
  // The WinDRBD agents ship under the linbit provider, i.e. ocf:linbit:HyperV.
  provider: 'linbit',
  keep: false,
};

function parseArgs(argv) {
  const options = { ...DEFAULTS, check: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--keep') options.keep = true;
    else if (arg === '--repo') options.repo = argv[++i];
    else if (arg === '--ref') options.ref = argv[++i];
    else if (arg === '--src') options.src = resolve(argv[++i]);
    else if (arg === '--out') options.out = resolve(argv[++i]);
    else if (arg === '--provider') options.provider = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 36).join('\n'));
      process.exit(0);
    } else {
      console.error(`unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

function clone(repo, ref, keep) {
  const dir = mkdtempSync(join(tmpdir(), 'ocf-rs-'));
  const args = ['clone', '--quiet', '--depth', '1'];
  if (ref) args.push('--branch', ref);
  args.push(repo, dir);
  console.error(`cloning ${repo}${ref ? ` (${ref})` : ''} ...`);
  execFileSync('git', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  if (keep) console.error(`checkout kept at ${dir}`);
  return dir;
}

/**
 * The meta-data XML inside a Rust agent, or null when the file has none.
 *
 * Raw string literals are matched with their exact hash count (`r#"..."#`,
 * `r##"..."##`), so a `"#` inside the XML — none today, but legal — cannot end
 * the literal early.
 */
export function extractMetaXml(source) {
  const open = /\br(#*)"/g;
  let match;
  while ((match = open.exec(source)) !== null) {
    const close = `"${match[1]}`;
    const end = source.indexOf(close, open.lastIndex);
    if (end === -1) continue;
    const body = source.slice(open.lastIndex, end);
    if (body.includes('<resource-agent')) return body;
    open.lastIndex = end + close.length;
  }
  return null;
}

function scanAgents(srcDir) {
  const agents = [];
  const skipped = [];
  // lib.rs / main.rs / resource_agent.rs are plumbing and simply carry no
  // metadata literal, so there is no list of files to keep in sync here.
  for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.rs')).sort()) {
    const xml = extractMetaXml(readFileSync(join(srcDir, file), 'utf8'));
    if (!xml) continue;
    const agent = toResourceAgent(parseXml(xml));
    if (!agent || !agent.name) {
      skipped.push([file, 'metadata XML has no <resource-agent name="...">']);
      continue;
    }
    agents.push(agent);
  }
  agents.sort((a, b) => a.name.localeCompare(b.name));
  return { agents, skipped };
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

/** A repo URL fit to be committed: CI clones with a job token in the userinfo
 *  (https://gitlab-ci-token:<token>@host/...), and this URL is recorded in the
 *  generated file. */
export function scrubUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    // Not a URL at all (an scp-style or local path); nothing to leak.
    return url;
  }
}

function render(agents, provider, repo, ref) {
  const doc = { providers: { [provider]: agents } };
  return (
    `// GENERATED FILE — do not edit by hand.\n` +
    `// Regenerate with: node scripts/generate-windows-agents.mjs\n` +
    `// Source: ${scrubUrl(repo)}${ref ? ` (${ref})` : ''}, parsed from the agents' meta_data() literals.\n` +
    `export const windowsAgents = ${JSON.stringify(doc, null, 2)} as const;\n`
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const checkout = options.src || clone(options.repo, options.ref, options.keep);
  let scan;
  try {
    scan = scanAgents(join(checkout, 'src'));
  } finally {
    if (!options.src && !options.keep) rmSync(checkout, { recursive: true, force: true });
  }
  const { agents, skipped } = scan;

  if (agents.length === 0) {
    // Writing an empty catalog would quietly take every Windows agent out of
    // the editor and still look like a successful run.
    console.error(`no agents found under ${join(checkout, 'src')} — refusing to write an empty catalog`);
    process.exit(1);
  }

  const rendered = await format(render(agents, options.provider, options.repo, options.ref), options.out);

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
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(options.out, rendered);
    const params = agents.reduce((n, a) => n + a.parameters.length, 0);
    const actions = agents.reduce((n, a) => n + a.actions.length, 0);
    console.log(`wrote ${options.out}`);
    console.log(`  ${agents.length} agents, ${params} parameters, ${actions} actions (provider: ${options.provider})`);
  }
  for (const [file, reason] of skipped) console.error(`  - skipped ${file}: ${reason}`);
}

// Only when run as a script: the parsing helpers above are unit-tested, and
// importing them must not clone a repository.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
