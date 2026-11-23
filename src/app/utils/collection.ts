// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2026 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/** The items whose `key` was not seen before, in order; a missing list gives []. */
export const uniqBy = <T, K extends keyof T>(items: readonly T[] | null | undefined, key: K): T[] => {
  const seen = new Set<T[K]>();
  return (items ?? []).filter((item) => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
};

/** The items grouped by the string value of `key`; a missing list gives {}. */
export const groupBy = <T, K extends keyof T>(items: readonly T[] | null | undefined, key: K): Record<string, T[]> => {
  const groups: Record<string, T[]> = {};
  for (const item of items ?? []) {
    (groups[String(item[key])] ??= []).push(item);
  }
  return groups;
};

/** The same values in the same order. */
export const sameList = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value, i) => value === b[i]);
