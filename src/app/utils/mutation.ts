// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * A mutationFn that hands the API function its variables only. react-query 5
 * calls mutationFn(variables, context), and an API function with an optional
 * second parameter would take that context for it.
 */
export const variablesOnly =
  <V, R>(fn: (variables: V) => R) =>
  (variables: V): R =>
    fn(variables);
