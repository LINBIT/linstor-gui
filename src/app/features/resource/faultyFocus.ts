// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

const FOCUS_FAULTY = 'faulty-resources';

/** Router state asking a dashboard to bring its list of faulty resources into view. */
export const focusFaultyState = { focus: FOCUS_FAULTY } as const;

export const isFocusFaulty = (state: unknown): boolean =>
  typeof state === 'object' && state !== null && (state as { focus?: unknown }).focus === FOCUS_FAULTY;
