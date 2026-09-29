// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

type RcLike = { message?: string; ret_code?: number };

export const rcFailures = (list: unknown): RcLike[] =>
  Array.isArray(list)
    ? list.filter(
        (e): e is RcLike =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as RcLike).ret_code === 'number' &&
          (e as RcLike).ret_code! < 0,
      )
    : [];

/**
 * The error text of a reply, or undefined when it succeeded. Covers the shapes
 * the API calls return: openapi-fetch's `{ error }` (it does not
 * throw on HTTP errors), an ApiCallRc list with a negative ret_code, and an
 * axios response carrying such a list in `data`.
 */
export const replyError = (res: unknown): string | undefined => {
  if (res && typeof res === 'object' && 'error' in res && (res as { error?: unknown }).error) {
    const err = (res as { error: unknown }).error;
    if (Array.isArray(err)) {
      // An error reply still lists the steps that worked ("... adjusted.",
      // "Deployed ... on 'n1'"); only the failures say what went wrong.
      const failures = rcFailures(err);
      return (
        (failures.length ? failures : err)
          .map((e) => (e as RcLike)?.message)
          .filter(Boolean)
          .join(', ') || 'error'
      );
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return String(err);
  }
  const failures = rcFailures(res).length ? rcFailures(res) : rcFailures((res as { data?: unknown } | undefined)?.data);
  if (failures.length) {
    return failures
      .map((e) => e.message)
      .filter(Boolean)
      .join(', ');
  }
  return undefined;
};
