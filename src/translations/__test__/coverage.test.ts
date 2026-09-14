// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import translations from '..';

// English is the source of truth: every string starts there, and i18next falls
// back to it for anything a language is missing. That fallback is silent, which
// is how six languages drifted a few hundred keys behind before anyone noticed.
//
// Every language is now at parity with English, and this keeps it that way:
// adding an English string without translating it fails the suite.
//
// MISSING_BUDGET is the escape hatch. A language may be given a temporary
// budget rather than blocking a change, but any entry is debt — lower it as you
// translate and delete it at zero. The second test fails on a budget left above
// the real number, so slack cannot sit there hiding the next drift.

type Tree = Record<string, unknown>;

/** Keys a language may still be missing. Empty is the goal; only revise down. */
const MISSING_BUDGET: Record<string, number> = {};

/** Every leaf path in a translation tree, as `namespace.some.key`. */
const flatten = (node: Tree, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value) ? flatten(value as Tree, path) : [path];
  });

const englishKeys = flatten(translations.en as unknown as Tree);
const languages = Object.keys(translations).filter((code) => code !== 'en') as Array<keyof typeof translations>;

describe('translation coverage', () => {
  it('has a non-trivial English catalog to compare against', () => {
    expect(englishKeys.length).toBeGreaterThan(500);
    expect(new Set(englishKeys).size).toBe(englishKeys.length);
  });

  it.each(languages)('%s covers every English key', (code) => {
    const keys = new Set(flatten(translations[code] as unknown as Tree));
    const missing = englishKeys.filter((key) => !keys.has(key));
    const budget = MISSING_BUDGET[code] ?? 0;

    expect(
      missing.length,
      missing.length > budget
        ? `${code} is missing ${missing.length} keys but is budgeted for ${budget}. ` +
            `Translate them, or raise the budget only if you have a reason. ` +
            `New: ${missing.slice(0, 8).join(', ')}`
        : '',
    ).toBeLessThanOrEqual(budget);
  });

  it.each(languages)('%s budget is not stale', (code) => {
    const keys = new Set(flatten(translations[code] as unknown as Tree));
    const missing = englishKeys.filter((key) => !keys.has(key)).length;
    const budget = MISSING_BUDGET[code] ?? 0;

    // Keeping the budget honest is the whole point: a budget left above the
    // real number lets the next drift hide inside the slack.
    expect(
      budget,
      budget > missing ? `${code} only misses ${missing} keys — lower its budget to ${missing}.` : '',
    ).toBe(missing);
  });

  it.each(languages)('%s has no keys English does not', (code) => {
    const english = new Set(englishKeys);
    const extra = flatten(translations[code] as unknown as Tree).filter((key) => !english.has(key));

    // A key no longer in English is dead weight i18next will never look up.
    // This found `settings.create_edit_label`, which was live in the passphrase
    // form but had no English entry, so English rendered the raw key.
    expect(
      extra,
      extra.length ? `${code} has ${extra.length} stale keys, e.g. ${extra.slice(0, 8).join(', ')}` : '',
    ).toEqual([]);
  });
  it.each(Object.keys(translations))('%s declares no duplicate keys inside a namespace', (code) => {
    // A repeated key in an object literal is legal and the last one silently
    // wins, so neither tsc nor the parity checks above can see it. Scan the
    // source instead. This caught common.storage_pool and
    // settings.linstor_passphrase, each defined twice with different values.
    const file = {
      en: 'english',
      zh: 'chinese',
      de: 'german',
      fr: 'french',
      es: 'spanish',
      ru: 'russian',
      tr: 'turkish',
      ja: 'japanese',
    }[code];
    const source = readFileSync(join(process.cwd(), 'src', 'translations', `${file}.ts`), 'utf8');
    const dupes: string[] = [];
    let namespace: string | null = null;
    let seen = new Set<string>();
    for (const line of source.split('\n')) {
      const open = /^  ([A-Za-z_][\w&-]*): \{/.exec(line);
      if (open) {
        namespace = open[1];
        seen = new Set();
        continue;
      }
      if (line.startsWith('  },')) {
        namespace = null;
        continue;
      }
      const key = namespace && /^    ([A-Za-z_][\w-]*):/.exec(line);
      if (!key) continue;
      if (seen.has(key[1])) dupes.push(`${namespace}.${key[1]}`);
      seen.add(key[1]);
    }
    expect(dupes, dupes.length ? `${code} has duplicate keys: ${dupes.join(', ')}` : '').toEqual([]);
  });
});
