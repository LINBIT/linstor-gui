// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// Shared OCF meta-data parsing, used by both catalog generators.
//
// Every OCF agent describes itself with the same ra-api-1 XML no matter what
// it is written in — the generators differ only in how they get that XML out
// of the source (shell heredoc, C string literal, Python triple-quote, Rust
// raw string). Once extracted it is the same document, so parsing it lives
// here rather than once per generator: two copies of an XML parser drift, and
// the two catalogs feed one editor that expects one shape.
//
// Pure Node, zero dependencies — the generators run on a CI runner that has
// only git and node.

// ---------------------------------------------------------------------------
// Minimal XML parser (tolerant, good enough for OCF ra-api-1 metadata)
// Returns a node: { tag, attrs: {}, children: [node...], text: string }
// ---------------------------------------------------------------------------
export function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

export function parseAttrs(raw) {
  const attrs = {};
  const re = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    attrs[m[1]] = decodeEntities(m[3] !== undefined ? m[3] : m[4]);
  }
  return attrs;
}

export function parseXml(xml) {
  // Strip prolog, doctype, comments, CDATA-wrap.
  xml = xml.replace(/<\?[\s\S]*?\?>/g, '');
  xml = xml.replace(/<!DOCTYPE[^>[]*(\[[\s\S]*?\])?>/gi, '');
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');
  xml = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c) =>
    c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

  const root = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const tagRe = /<\/?([:\w-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let last = 0;
  let m;
  while ((m = tagRe.exec(xml)) !== null) {
    const between = xml.slice(last, m.index);
    if (between.trim()) {
      stack[stack.length - 1].text += decodeEntities(between);
    }
    last = tagRe.lastIndex;

    const isClose = m[0][1] === '/';
    const name = m[1];
    const selfClose = m[3] === '/';

    if (isClose) {
      // Pop up to the matching open tag.
      for (let i = stack.length - 1; i >= 1; i--) {
        if (stack[i].tag === name) { stack.length = i; break; }
      }
    } else {
      const node = { tag: name, attrs: parseAttrs(m[2]), children: [], text: '' };
      stack[stack.length - 1].children.push(node);
      if (!selfClose) stack.push(node);
    }
  }
  return root;
}

export function firstChild(node, tag) {
  return node.children.find((c) => c.tag === tag) || null;
}

export function childText(node, tag) {
  const c = firstChild(node, tag);
  return c ? c.text.trim() : '';
}

// ---------------------------------------------------------------------------
// Map parsed XML tree -> flattened ResourceAgent
// ---------------------------------------------------------------------------
export function toResourceAgent(root) {
  const ra = root.children.find((c) => c.tag === 'resource-agent');
  if (!ra) return null;

  const version = ra.attrs.version || childText(ra, 'version') || '0.0';
  const paramsNode = firstChild(ra, 'parameters');
  const actionsNode = firstChild(ra, 'actions');

  const parameters = !paramsNode ? [] : paramsNode.children
    .filter((c) => c.tag === 'parameter')
    .map((p) => {
      const content = firstChild(p, 'content');
      return {
        name: p.attrs.name || '',
        unique: p.attrs.unique === '1',
        required: p.attrs.required === '1',
        shortdesc: childText(p, 'shortdesc'),
        longdesc: childText(p, 'longdesc'),
        type: content ? (content.attrs.type || '') : '',
        default: content ? (content.attrs.default || '') : '',
      };
    });

  const actions = !actionsNode ? [] : actionsNode.children
    .filter((c) => c.tag === 'action')
    .map((a) => ({
      name: a.attrs.name || '',
      timeout: a.attrs.timeout || '',
      interval: a.attrs.interval || '',
      depth: a.attrs.depth || '',
    }));

  return {
    name: ra.attrs.name || '',
    version,
    shortdesc: childText(ra, 'shortdesc'),
    longdesc: childText(ra, 'longdesc'),
    parameters,
    actions,
  };
}
