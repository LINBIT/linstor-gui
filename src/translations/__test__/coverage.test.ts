// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import translations from '..';

// English is the source of truth: every string starts there, and i18next falls
// back to it for anything a language is missing. That fallback is silent, which
// is how six languages drifted a few hundred keys behind before anyone noticed.
//
// This is a ratchet, not a pass/fail gate. Filling six languages needs people
// who speak them, so the debt is recorded per language below and the test fails
// only when a language gets *worse* — adding an English string without
// translating it is fine, adding two and translating none is not. Lower a
// number whenever you translate; delete the entry when it reaches zero.

type Tree = Record<string, unknown>;

/** Keys a language may still be missing. Only ever revise these downwards. */
const MISSING_BUDGET: Record<string, number> = {
  de: 364,
  es: 364,
  fr: 364,
  ja: 364,
  ru: 364,
  tr: 364,
};

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

  it.each(languages)('%s is no further behind English than its recorded budget', (code) => {
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
});
