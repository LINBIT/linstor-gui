#!/usr/bin/env node
// extract-ra-metadata.mjs
//
// Pure Node.js, ZERO npm dependencies. Clones ClusterLabs/resource-agents and
// statically parses every agent's `meta_data()` heredoc into a single merged
// JSON — WITHOUT executing any agent and WITHOUT installing the
// resource-agents package. Designed to run inside a GitLab runner that has
// only `git` and `node` available.
//
// The output matches drbd-ha's `ResourceAgentsByProvider` shape:
//   { "providers": { "heartbeat": [ { name, version, shortdesc, longdesc,
//       parameters: [{ name, unique, required, shortdesc, longdesc, type,
//       default }], actions: [{ name, timeout, interval, depth }] } ] } }
//
// SOURCE FORMATS HANDLED (all statically, no execution):
//   * POSIX shell agents  — `meta_data() { cat <<END ... END }` heredoc, with
//     `OCF_RESKEY_<x>_default` substitution. The bulk of the catalog.
//   * C agents            — `IPv6addr.c`: adjacent C string literals concatenated
//                           and unescaped.
//   * Python agents (some)— `gcp-*`: `METADATA = '''<xml>'''.format(DICT['k'], ...)`
//                           triple-quoted literal + literal-dict .format() args.
//
// LIMITATIONS (verified by diffing against `ra-params convert` — which executes each
// installed agent — over 138 heartbeat agents on a real cluster node):
//
//  1. Runtime-resolved defaults. `default="${OCF_RESKEY_<x>_default}"` resolves from
//     the `OCF_RESKEY_<x>_default=` assignment in the same script. Values computed at
//     runtime (`$(which foo)`, `"${HA_VARRUN}/Foo.state"`, `${OCF_RESOURCE_INSTANCE}`)
//     can't be resolved offline and are blanked out. 36/138 agents differ from the
//     executed agent in a default value ONLY — mostly paths that embed the resource
//     instance name, which is not knowable until the resource is configured.
//  2. Parameters emitted by a SOURCED helper. openstack-* `. source` a common file
//     whose function cat's an extra metadata heredoc; those params live in another
//     file and are not captured (4 agents).
//  3. Python agents using the ocf.py `Agent` API (`agent.add_parameter(name=...)`)
//     rather than an XML literal — azure-events, azure-events-az, dummypy. These are
//     reported as skips; capturing them would need a real Python AST walk.
//  4. Rare agents whose installed binary emits different metadata than the source
//     file's `meta_data()` (e.g. ganesha-nfs).
//
// Everything else — parameter names, types, required/unique, descriptions, actions,
// and static defaults — matches the executed agent byte-for-byte (97/138 fully
// identical INCLUDING defaults; 133/138 structurally exact; linbit/drbd is 2/2
// exact). If you need runtime-accurate defaults or the sourced params, run the
// agent's `meta-data` on a box that has the package instead.
//
// Usage:
//   node extract-ra-metadata.mjs [options]
//     --all            Build every provider (heartbeat + linbit + pacemaker) from
//                      their three upstream repos into one document. This is what
//                      regenerates linstor-gui's all_agents.ts.
//     --format <f>     json (default) | ts   — `ts` emits `export const allAgents = ...`
//     --out <file>     Output path                 (default: agents.json)
//     --ref <ref>      Branch/tag to clone         (default: per-source default)
//     --repo <url>     Repo URL                    (default: ClusterLabs/resource-agents)
//     --subdir <dir>   Agent dir inside the repo   (default: heartbeat)
//     --provider <p>   Provider name in output     (default: heartbeat)
//     --src <dir>      Use an existing checkout instead of cloning
//     --merge <file>   Carry over agents from an existing catalog that static
//                      parsing cannot reach (ocf.Agent-API Python agents), so a
//                      regeneration never silently drops entries the UI offers.
//                      Upstream always wins; merging only adds what we lost.
//     --keep           Do not delete the temp clone
//     --pretty         Pretty-print the JSON output
//
// Regenerate linstor-gui's static catalog:
//   node extract-ra-metadata.mjs --all --format ts \
//     --out src/app/components/OcfAgentEditor/all_agents.ts
//
// The three providers come from DIFFERENT upstreams — heartbeat from
// resource-agents, linbit from drbd-utils, pacemaker from pacemaker itself:

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The XML side of this lives in a module shared with generate-windows-agents.mjs:
// both catalogs describe agents with the same ra-api-1 document and have to come
// out the same shape.
import { parseXml, toResourceAgent } from './lib/ocf-xml.mjs';

// ---------------------------------------------------------------------------
// Upstream sources. `ocf:<provider>:<agent>` names in a drbd-reactor config are
// served by three separate projects, so a complete catalog needs all three.
// ---------------------------------------------------------------------------
const SOURCES = [
  {
    provider: 'heartbeat',
    repo: 'https://github.com/ClusterLabs/resource-agents.git',
    // ldirectord ships as ocf:heartbeat:ldirectord but lives in its own top-level
    // directory, so the provider is assembled from two paths.
    subdirs: ['heartbeat', 'ldirectord/OCF'],
    ref: 'main',
  },
  {
    provider: 'linbit',
    repo: 'https://github.com/LINBIT/drbd-utils.git',
    subdir: 'scripts',
    ref: 'master',
  },
  {
    provider: 'pacemaker',
    repo: 'https://github.com/ClusterLabs/pacemaker.git',
    subdir: 'agents/ocf',
    ref: 'main',
  },
];

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = {
    out: null,
    ref: null,
    repo: 'https://github.com/ClusterLabs/resource-agents.git',
    subdir: 'heartbeat',
    provider: 'heartbeat',
    src: null,
    keep: false,
    pretty: false,
    all: false,
    format: 'json',
    merge: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--out': opts.out = argv[++i]; break;
      case '--ref': opts.ref = argv[++i]; break;
      case '--repo': opts.repo = argv[++i]; break;
      case '--subdir': opts.subdir = argv[++i]; break;
      case '--provider': opts.provider = argv[++i]; break;
      case '--src': opts.src = argv[++i]; break;
      case '--keep': opts.keep = true; break;
      case '--pretty': opts.pretty = true; break;
      case '--only': opts.only = argv[++i]; break;
      case '--dump': opts.dump = true; break;
      case '--all': opts.all = true; break;
      case '--format': opts.format = argv[++i]; break;
      case '--merge': opts.merge = argv[++i]; break;
      case '-h': case '--help':
        console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${a}`);
        process.exit(2);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Shell-ish helpers: collect OCF_RESKEY_*_default and resolve ${...}/$VAR
// ---------------------------------------------------------------------------
function stripShellQuotes(raw) {
  let v = raw.trim();
  // Drop a trailing inline comment only when clearly outside quotes.
  if (v.startsWith('"')) {
    const end = v.indexOf('"', 1);
    return end >= 0 ? v.slice(1, end) : v.slice(1);
  }
  if (v.startsWith("'")) {
    const end = v.indexOf("'", 1);
    return end >= 0 ? v.slice(1, end) : v.slice(1);
  }
  // Bare word: up to first whitespace/; and drop command subs.
  v = v.split(/[\s;]/)[0];
  return v;
}

// Collect `OCF_RESKEY_<x>_default=` assignments.
//
// Indentation is significant, so both forms are gathered and then arbitrated:
//
//   * Column 0 = unconditional. It's the value the agent always starts from
//     (IPaddr2 sets check_link_status_default="true" at top level, then a `case`
//     arm overrides it to "false" only for one NIC type — "true" is the default
//     the agent reports).
//   * Indented = inside a function or an if/case block. Some agents ONLY declare
//     defaults there (linbit/drbd's wfc_timeout_default="5"), so they can't be
//     ignored. For the common `if <special-platform>; then A; else B; fi` idiom
//     (asterisk's OpenBSD "_asterisk" vs "asterisk", azure-lb's SUSE socat vs nc)
//     the LAST arm is the generic one, so among indented candidates the last
//     non-empty value wins.
//
// A candidate that resolves to empty (e.g. `binary_default=$(which foo)`, which
// can't be evaluated offline) never beats one that produced a real value — this is
// what lets corosync-qnetd fall back to its `if`-block literal.
//
// A `: ${VAR:=...}` idiom is not an assignment and is intentionally not matched.
function pickDefault(cands) {
  const unconditional = cands.filter((c) => c.col0 && c.val !== '');
  if (unconditional.length) return unconditional[0].val;
  const nonEmpty = cands.filter((c) => c.val !== '');
  if (nonEmpty.length) return nonEmpty[nonEmpty.length - 1].val;
  return cands.length ? cands[cands.length - 1].val : '';
}

function collectDefaults(script) {
  const cands = {};
  const re = /^([ \t]*)(OCF_RESKEY_\w+_default)=(.*)$/gm;
  let m;
  while ((m = re.exec(script)) !== null) {
    const raw = stripShellQuotes(m[3]);
    (cands[m[2]] = cands[m[2]] || []).push({ col0: m[1] === '', raw, val: raw });
  }
  // Seed the map so cross-references between defaults can resolve, then refine:
  // each pass re-substitutes every candidate and re-arbitrates the winner.
  const map = {};
  for (const k of Object.keys(cands)) map[k] = pickDefault(cands[k]);
  for (let pass = 0; pass < 4; pass++) {
    for (const k of Object.keys(cands)) {
      for (const c of cands[k]) c.val = substitute(c.raw, map);
      map[k] = pickDefault(cands[k]);
    }
  }
  return map;
}

// Replace shell parameter expansions using the defaults map; unknown → ''.
function substitute(str, defaults) {
  // In an unquoted heredoc, `\$` is an escaped dollar: shell emits a literal `$`
  // and does NOT expand the variable (e.g. mysql's longdesc documents
  // `\${INSTANCE_ATTR_NAME}_mysql_master_IP`). Protect these with a sentinel so the
  // expansion regexes below skip them, then restore to a bare `$` at the end.
  // First: backslash-newline is a line continuation inside an unquoted heredoc —
  // the shell drops both the backslash and the newline, joining the two lines.
  str = str.replace(/\\\n/g, '');
  const SENT = ' ';
  str = str.replace(/\\\$/g, SENT);
  // ${VAR:-word} and ${VAR}
  str = str.replace(/\$\{([A-Za-z_]\w*)(:-([^}]*))?\}/g, (_, name, hasDef, dflt) => {
    if (Object.prototype.hasOwnProperty.call(defaults, name)) return defaults[name];
    if (hasDef !== undefined) return dflt;
    return '';
  });
  // Catch remaining ${VAR%%..}, ${VAR##..}, ${VAR:offset} etc: use bare var if known, else ''.
  // Bounded (no " ' < > newline) so a stray `${` can never span XML structure.
  str = str.replace(/\$\{[^}"'<>\n]*\}/g, (m) => {
    const nm = m.slice(2).match(/^[A-Za-z_]\w*/);
    if (nm && Object.prototype.hasOwnProperty.call(defaults, nm[0])) return defaults[nm[0]];
    return '';
  });
  // $VAR
  str = str.replace(/\$([A-Za-z_]\w*)/g, (_, name) =>
    Object.prototype.hasOwnProperty.call(defaults, name) ? defaults[name] : '');
  // Command substitutions and backticks → '' (e.g. `binary_default=$(which foo)`).
  // BOUNDED: the char class excludes " ' < > and newline, and the closing paren
  // is optional — so an unbalanced `$(which` (produced when a bare-word default is
  // split on whitespace) is removed WITHIN its attribute instead of greedily eating
  // XML up to the next ')' elsewhere in the document.
  str = str.replace(/\$\([^)"'<>\n]*\)?/g, '');
  str = str.replace(/`[^`"'<>\n]*`?/g, '');
  // Autoconf @VAR@ placeholders (from .in templates) → ''.
  str = str.replace(/@[A-Za-z_]\w*@/g, '');
  // Restore escaped dollars as literal `$` (the backslash is dropped, matching
  // what the shell emits for `\$` inside an unquoted heredoc).
  str = str.replace(new RegExp(SENT, 'g'), '$');
  return str;
}

// ---------------------------------------------------------------------------
// C source agents (IPv6addr.c): the metadata is a run of adjacent C string
// literals assigned to a `const char* meta_data`, e.g.
//     "<?xml version=\"1.0\"?>\n"
//     "<resource-agent name=\"IPv6addr\" version=\"1.0\">\n"
//     ...
//     "</resource-agent>\n";
// Concatenate the run and unescape it — no compiler or execution required.
// ---------------------------------------------------------------------------
function unescapeC(s) {
  return s.replace(/\\(x[0-9a-fA-F]{1,2}|[0-7]{1,3}|.)/g, (_, e) => {
    switch (e) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '0': return '\0';
      case '"': return '"';
      case "'": return "'";
      case '\\': return '\\';
      default:
        if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
        if (/^[0-7]+$/.test(e)) return String.fromCharCode(parseInt(e, 8));
        return e;
    }
  });
}

function extractMetaXmlFromC(src) {
  const lit = /"((?:[^"\\]|\\.)*)"/g;
  const lits = [];
  let m;
  while ((m = lit.exec(src)) !== null) {
    lits.push({ raw: m[1], start: m.index, end: lit.lastIndex });
  }
  for (let i = 0; i < lits.length; i++) {
    if (!lits[i].raw.includes('<?xml') && !lits[i].raw.includes('<resource-agent')) continue;
    let out = '';
    for (let j = i; j < lits.length; j++) {
      // Adjacent literals may only be separated by whitespace / line continuations.
      if (j > i && !/^[\s\\]*$/.test(src.slice(lits[j - 1].end, lits[j].start))) break;
      out += lits[j].raw;
      if (lits[j].raw.includes('</resource-agent>')) break;
    }
    if (out.includes('<resource-agent') && out.includes('</resource-agent>')) {
      return unescapeC(out);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Python agents that hold the metadata in a triple-quoted literal, e.g. gcp-*:
//     PARAMETERS = { 'disk_name': '', 'disk_scope': 'detect', ... }
//     METADATA = '''<?xml ...  <content default="{}" /> ... </resource-agent>'''.format(
//         PARAMETERS['disk_name'], PARAMETERS['disk_scope'], ...)
// The XML is static and the .format() arguments resolve against literal dicts, so
// both structure and defaults are recoverable without running Python.
//
// NOT handled: agents that build metadata through the ocf.py `Agent` API
// (`agent.add_parameter(name=..., ...)`) — that needs a real Python AST walk.
// ---------------------------------------------------------------------------
function parsePyDicts(src) {
  const dicts = {};
  const re = /^([A-Za-z_]\w*)\s*=\s*\{([^{}]*)\}/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const d = {};
    const kv = /['"]([^'"]+)['"]\s*:\s*(?:'([^']*)'|"([^"]*)")/g;
    let k;
    while ((k = kv.exec(m[2])) !== null) d[k[1]] = k[2] !== undefined ? k[2] : k[3];
    dicts[m[1]] = d;
  }
  return dicts;
}

function splitTopLevelArgs(s) {
  const out = [];
  let cur = '', depth = 0, q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === q && s[i - 1] !== '\\') q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    if (c === ')' || c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function resolvePyExpr(expr, dicts) {
  let m = expr.match(/^([A-Za-z_]\w*)\s*\[\s*['"]([^'"]+)['"]\s*\]$/);
  if (m) return dicts[m[1]]?.[m[2]] ?? '';
  m = expr.match(/^'([^']*)'$|^"([^"]*)"$/);
  if (m) return m[1] !== undefined ? m[1] : m[2];
  return '';
}

function extractMetaXmlFromPython(src) {
  const dicts = parsePyDicts(src);
  const re = /('''|""")([\s\S]*?)\1/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const body = m[2];
    if (!body.includes('<resource-agent')) continue;
    let out = body;
    const after = src.slice(re.lastIndex);
    const fm = after.match(/^\s*\.\s*format\s*\(/);
    if (fm) {
      // Take the balanced argument list of .format(...)
      let i = after.indexOf('(', fm[0].length - 1), depth = 0, end = -1;
      for (let j = i; j < after.length; j++) {
        if (after[j] === '(') depth++;
        else if (after[j] === ')') { depth--; if (depth === 0) { end = j; break; } }
      }
      if (end > i) {
        const vals = splitTopLevelArgs(after.slice(i + 1, end)).map((a) => resolvePyExpr(a, dicts));
        let n = 0;
        out = out.replace(/\{(\d*)\}/g, (_, d) => (d === '' ? (vals[n++] ?? '') : (vals[Number(d)] ?? '')));
      }
    }
    return out;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Heredoc scanning
//
// A metadata function is often built from SEVERAL `cat <<END` blocks with helper
// calls in between — openstack-* look like:
//
//     meta_data() {
//         cat <<END
//         ... <parameters>
//     END
//         common_meta_data          # helper in a sourced .sh, cat's more <parameter>s
//         cat <<END
//         ... </parameters> </resource-agent>
//     END
//     }
//
// Taking only the first heredoc truncates the document, so scan the whole function
// body, concatenate every heredoc in order, and inline bare helper calls.
// ---------------------------------------------------------------------------

// All heredocs in `block`, in source order, as {body, start, end}.
function scanHeredocs(block) {
  const out = [];
  // Delimiters may be unquoted (END, EOF, !) or quoted ("END"). Excludes a leading
  // `<` so `<<<` here-strings never match.
  const re = /<<(-?)\s*(?:(["'`])([^"'`]+)\2|([^\s<'"`]+))/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const dashStrip = m[1] === '-';
    const delim = m[3] !== undefined ? m[3] : m[4];
    const bodyStart = block.indexOf('\n', re.lastIndex);
    if (bodyStart < 0) continue;
    const delimEsc = delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const closeRe = new RegExp(`^${dashStrip ? '[ \\t]*' : ''}${delimEsc}\\s*$`, 'm');
    const rest = block.slice(bodyStart + 1);
    const cm = closeRe.exec(rest);
    if (!cm) continue;
    out.push({ body: rest.slice(0, cm.index), start: m.index, end: bodyStart + 1 + cm.index });
    re.lastIndex = bodyStart + 1 + cm.index;
  }
  return out;
}

// Body of `fnName() { ... }`, delimited by a closing brace at column 0 (the shell
// convention). Brace counting is avoided because `${VAR}` inside heredocs would
// throw it off.
function extractFunctionBody(script, fnName) {
  const esc = fnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^[ \\t]*(?:function[ \\t]+)?${esc}[ \\t]*\\(\\)[ \\t]*\\{[ \\t]*$`, 'm');
  const m = re.exec(script);
  if (!m) return null;
  const start = m.index + m[0].length;
  const rest = script.slice(start);
  const em = /^\}[ \t]*$/m.exec(rest);
  return em ? rest.slice(0, em.index) : rest;
}

// Concatenate every heredoc in a function body, expanding bare helper-function
// calls (looked up in this script first, then in sourced helpers).
function assembleFromFunction(body, lookup, depth = 0) {
  if (depth > 4) return '';
  const docs = scanHeredocs(body);
  const pieces = [];
  let cursor = 0;
  for (const d of docs) {
    // Between heredocs, a line that is just an identifier is a helper call.
    for (const line of body.slice(cursor, d.start).split('\n')) {
      const call = line.trim().match(/^([A-Za-z_]\w*)$/);
      if (!call) continue;
      const helper = lookup(call[1]);
      if (helper) pieces.push(assembleFromFunction(helper, lookup, depth + 1));
    }
    pieces.push(d.body);
    cursor = d.end;
  }
  for (const line of body.slice(cursor).split('\n')) {
    const call = line.trim().match(/^([A-Za-z_]\w*)$/);
    if (!call) continue;
    const helper = lookup(call[1]);
    if (helper) pieces.push(assembleFromFunction(helper, lookup, depth + 1));
  }
  return pieces.join('\n');
}

// `lookup` resolves a helper function name to its body, searching this script and
// any `. ${OCF_FUNCTIONS_DIR}/foo.sh` it sources. May be omitted.
function extractMetaXml(script, sourcedTexts = []) {
  const lookup = (name) => {
    for (const text of [script, ...sourcedTexts]) {
      const b = extractFunctionBody(text, name);
      if (b && b.includes('<<')) return b;
    }
    return null;
  };

  // Prefer assembling from the function that emits <resource-agent>.
  const docs = scanHeredocs(script);
  const anchor = docs.find((d) => d.body.includes('<resource-agent'));
  if (!anchor) return null;

  // Identify the enclosing function by name, then assemble its whole body.
  const before = script.slice(0, anchor.start);
  const fnMatch = [...before.matchAll(/^[ \t]*(?:function[ \t]+)?([A-Za-z_]\w*)[ \t]*\(\)[ \t]*\{[ \t]*$/gm)].pop();
  if (fnMatch) {
    const body = extractFunctionBody(script, fnMatch[1]);
    if (body) {
      const assembled = assembleFromFunction(body, lookup);
      if (assembled.includes('<resource-agent') && assembled.includes('</resource-agent>')) {
        return assembled;
      }
    }
  }
  return anchor.body;
}

// Read the helper files an agent sources, e.g.
//   . ${OCF_FUNCTIONS_DIR}/openstack-common.sh
// In a source checkout the helper sits beside the agents (heartbeat/foo.sh); in an
// installed tree it lives under <ocf_root>/lib/heartbeat/. ocf-shellfuncs itself is
// skipped — it defines no metadata and is large.
function readSourcedHelpers(script, agentsDir) {
  const out = [];
  const re = /^[ \t]*\.[ \t]+\S*?([A-Za-z0-9_.-]+\.sh)[ \t]*$/gm;
  let m;
  while ((m = re.exec(script)) !== null) {
    const name = m[1];
    if (/^ocf-/.test(name)) continue;
    for (const cand of [
      join(agentsDir, name),
      join(agentsDir, '..', '..', 'lib', 'heartbeat', name),
      join(agentsDir, '..', 'lib', 'heartbeat', name),
    ]) {
      try {
        const text = readFileSync(cand, 'utf8');
        out.push(text);
        break;
      } catch { /* try next candidate */ }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
// Build one provider's agent list from a checkout (cloning if needed).
// Returns { agents, scanned, failures }.
function buildProvider({ repo, ref, subdir, subdirs, provider, src, keep }, opts) {
  let repoDir = src;
  let tmp = null;
  if (!repoDir) {
    tmp = mkdtempSync(join(tmpdir(), 'ra-agents-'));
    console.error(`[${provider}] cloning ${repo} (${ref}) ...`);
    execFileSync('git', ['clone', '--depth', '1', '--branch', ref, repo, tmp], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    repoDir = tmp;
  }

  const dirs = subdirs && subdirs.length ? subdirs : [subdir];
  const byName = new Map();
  const failures = [];
  let scanned = 0;
  for (const d of dirs) {
    const r = scanAgentDir(join(repoDir, d), byName, failures, opts);
    scanned += r;
  }
  const agents = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  if (tmp && !keep) rmSync(tmp, { recursive: true, force: true });
  return { agents, scanned, failures };
}

// Scan one directory of agent files, adding to `byName`. Returns candidates seen.
function scanAgentDir(agentsDir, byName, failures, opts) {
  let entries;
  try {
    entries = readdirSync(agentsDir);
  } catch (e) {
    failures.push([agentsDir, `unreadable: ${e.message}`]);
    return 0;
  }

  let scanned = 0;

  // Prefer plain files over their .in templates by processing plain first.
  entries.sort((a, b) => {
    const ai = a.endsWith('.in') ? 1 : 0;
    const bi = b.endsWith('.in') ? 1 : 0;
    return ai - bi || a.localeCompare(b);
  });

  for (const entry of entries) {
    // Skip editor/admin leftovers. These declare the same `name=` as the real agent
    // (a live node was found carrying `ganesha-nfs.v01.bak`), so indexing them would
    // let a stale copy win the name.
    if (/(\.bak|\.orig|\.rpmsave|\.rpmnew|\.dpkg-[a-z]+|~)$/i.test(entry)) continue;
    const full = join(agentsDir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (!st.isFile()) continue;

    let script;
    try { script = readFileSync(full, 'utf8'); } catch { continue; }
    if (!script.includes('<resource-agent')) {
      // Don't drop these silently: a Python agent can build its metadata through the
      // ocf.py `Agent` API instead of embedding XML, so it has no literal to find.
      if (/^#!.*python/i.test(script) && /ocf\.Agent\s*\(|add_parameter\s*\(/.test(script)) {
        scanned++;
        failures.push([entry, 'metadata built via ocf.Agent API (needs a Python AST walk)']);
      }
      continue;
    }

    scanned++;
    try {
      const isC = /\.(c|cc|cpp)$/.test(entry);
      // Shebang may be a literal interpreter or an autoconf placeholder (`#!@PYTHON@`).
      const isPy = /^#!.*python/i.test(script) || /\.py$/.test(entry);
      let xml;
      if (isC) {
        // C agents embed the metadata as string literals; no shell expansion applies.
        xml = extractMetaXmlFromC(script);
        if (!xml) { failures.push([entry, 'no C string-literal metadata found']); continue; }
      } else if (isPy) {
        xml = extractMetaXmlFromPython(script);
        if (!xml) { failures.push([entry, 'python agent builds metadata via ocf.Agent API (needs AST)']); continue; }
      } else {
        const sourced = readSourcedHelpers(script, agentsDir);
        const rawXml = extractMetaXml(script, sourced);
        if (!rawXml) { failures.push([entry, 'no meta-data heredoc found']); continue; }
        // Helper files also carry their own OCF_RESKEY_*_default declarations.
        xml = substitute(rawXml, collectDefaults([script, ...sourced].join('\n')));
      }
      const agent = toResourceAgent(parseXml(xml));
      if (!agent || !agent.name) { failures.push([entry, 'no <resource-agent name=...>']); continue; }
      // Reject unrendered templates: ocf.py (a helper library, not an agent) carries a
      // `to_xml()` string with `name="{name}"`, which would otherwise register as an
      // agent literally called "{name}".
      if (/[{}$@]/.test(agent.name)) {
        failures.push([entry, `template placeholder, not a real agent (name=${agent.name})`]);
        continue;
      }
      if (opts.dump && (!opts.only || agent.name === opts.only)) {
        console.error(`\n===== DUMP ${agent.name} (${entry}) =====`);
        console.error(`--- substituted XML (first 2500 chars) ---\n${xml.slice(0, 2500)}`);
        console.error(`--- parsed params (${agent.parameters.length}) ---`);
        console.error(agent.parameters.map((p) => `${p.name}:${p.type}`).join(' | '));
      }
      if (!byName.has(agent.name)) byName.set(agent.name, agent);
    } catch (e) {
      failures.push([entry, e.message]);
    }
  }

  return scanned;
}

// Load an existing catalog (.json or a `export const allAgents = {...}` .ts).
function loadExistingCatalog(path) {
  const text = readFileSync(path, 'utf8');
  const body = text
    .replace(/^[\s\S]*?export\s+const\s+allAgents\s*=\s*/, '')
    .replace(/;\s*$/, '');
  // The file is generated data, not arbitrary input; Function is enough to read the
  // object literal without pulling in a TS parser.
  return Function(`"use strict";return (${body});`)();
}

// Carry forward agents the static parser cannot reach (metadata built through the
// ocf.py Agent API) so regenerating never silently drops entries the UI already
// offers. Anything present upstream always wins — merging only ADDS what we lost.
function mergeWithExisting(doc, existingPath) {
  let prev;
  try {
    prev = loadExistingCatalog(existingPath);
  } catch (e) {
    console.error(`--merge: cannot read ${existingPath} (${e.message}); writing fresh output.`);
    return { carried: [], dropped: [] };
  }
  const carried = [];
  const dropped = [];
  for (const [provider, list] of Object.entries(prev.providers || {})) {
    const fresh = (doc.providers[provider] = doc.providers[provider] || []);
    const have = new Set(fresh.map((a) => a.name));
    for (const agent of list) {
      if (have.has(agent.name)) continue;
      if (UNREACHABLE.has(agent.name)) {
        fresh.push(agent);
        carried.push(`${provider}/${agent.name}`);
      } else {
        // Not carried: absent upstream means it was removed there (e.g. rkt, o2cb).
        dropped.push(`${provider}/${agent.name}`);
      }
    }
    fresh.sort((a, b) => a.name.localeCompare(b.name));
  }
  return { carried, dropped };
}

// Agents whose metadata is built via the ocf.py `Agent` API — statically
// unreachable, so a previous catalog is the only source for them.
const UNREACHABLE = new Set([
  'azure-events',
  'azure-events-az',
  'azure-sap-zone',
  'dummypy',
  'ibm-cloud-vpc-cr-vip',
  'ibm-cloud-vpc-move-fip',
  'ibm-cloud-vpc-move-par',
  'powervs-move-ip',
  'powervs-subnet',
]);

// Emit a TS module matching linstor-gui's all_agents.ts. JSON.stringify produces a
// valid TS object literal (double-quoted keys/strings are legal TS); run the
// project's prettier afterwards if you want it reformatted to house style.
function renderTs(doc) {
  return (
    '// GENERATED FILE — do not edit by hand.\n' +
    '// Regenerate with scripts/extract-ra-metadata.mjs --all --format ts\n' +
    `export const allAgents = ${JSON.stringify(doc, null, 2)};\n`
  );
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const out = opts.out || (opts.format === 'ts' ? 'all_agents.ts' : 'agents.json');

  const sources = opts.all
    ? SOURCES
    : [{
        provider: opts.provider,
        repo: opts.repo,
        subdir: opts.subdir,
        ref: opts.ref || 'main',
      }];

  if (opts.all && opts.src) {
    console.error('--all clones three upstreams; it cannot be combined with --src.');
    process.exit(2);
  }

  const providers = {};
  let totalScanned = 0;
  const allFailures = [];

  for (const s of sources) {
    const cfg = {
      ...s,
      ref: opts.ref || s.ref,
      src: opts.all ? null : opts.src,
      keep: opts.keep,
    };
    let res;
    try {
      res = buildProvider(cfg, opts);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    providers[s.provider] = res.agents;
    totalScanned += res.scanned;
    for (const f of res.failures) allFailures.push([`${s.provider}/${f[0]}`, f[1]]);
    console.error(`[${s.provider}] ${res.agents.length} agents (${res.scanned} candidates scanned)`);
  }

  const doc = { providers };

  if (opts.merge) {
    const { carried, dropped } = mergeWithExisting(doc, opts.merge);
    if (carried.length) {
      console.error(`\nCarried over ${carried.length} agent(s) unreachable by static parsing:`);
      for (const n of carried) console.error(`  + ${n}`);
    }
    if (dropped.length) {
      console.error(`\nNot carried over (absent upstream — removed there): ${dropped.join(', ')}`);
    }
  }

  writeFileSync(
    out,
    opts.format === 'ts' ? renderTs(doc) : JSON.stringify(doc, null, opts.pretty ? 2 : 0),
  );

  const total = Object.values(providers).reduce((n, a) => n + a.length, 0);
  console.error(`\nExtracted ${total} agents across ${Object.keys(providers).length} provider(s) -> ${out}`);
  if (allFailures.length) {
    console.error(`Skipped ${allFailures.length}:`);
    for (const [name, reason] of allFailures) console.error(`  - ${name}: ${reason}`);
  }
}

main();
