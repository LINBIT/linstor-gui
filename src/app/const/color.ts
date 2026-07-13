// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * Design tokens — the single source of truth for the brand palette.
 *
 * Before this module these values lived as magic hex strings scattered across
 * the base components and feature code (#FFCC9C alone appeared 55 times). Use
 * these tokens instead of inlining hex so the brand stays consistent and is
 * changed in exactly one place.
 *
 * Two distinct "oranges" exist by design:
 *   - `brand.primary`  (#FFCC9C) light peach, used as a FILL with dark text on top.
 *   - `brand.accent`   (#F79133) darker orange, used for ICONS / TEXT / chart
 *                       series on light backgrounds where the peach is illegible.
 */
export const tokens = {
  color: {
    brand: {
      /** Light peach. Fills (primary buttons, switch-on, selected). Pair with `onPrimary` text. */
      primary: '#FFCC9C',
      /** Hover shade for brand fills. */
      primaryHover: '#FFDCBC',
      /** Active/pressed shade for brand fills. */
      primaryActive: '#FFBA80',
      /** Darker accent orange for icons / text / charts on light backgrounds. */
      accent: '#F79133',
      /** Text/icon color drawn on top of a `primary` fill. */
      onPrimary: '#111111',
    },
    text: {
      primary: '#111111',
    },
    link: {
      default: '#499BBB',
      hover: '#2C7FB8',
      active: '#1E5A8A',
    },
    danger: {
      base: '#DA1E28',
      contrast: '#FFFFFF',
    },
    neutral: {
      white: '#FFFFFF',
      borderDefault: '#D9D9D9',
      disabledBg: '#F5F5F5',
      disabledBorder: '#D9D9D9',
      disabledText: '#BFBFBF',
    },
    semantic: {
      success: '#52C41A',
      error: '#FF4D4F',
    },
  },
  /** Focus ring (box-shadow) for interactive controls. */
  focusRing: 'rgba(255, 204, 156, 0.2)',
  /** Default control corner radius, in px. */
  radius: 4,
} as const;

/**
 * Back-compat aliases. Existing call sites import these names directly; they
 * now resolve through the token table. Prefer `tokens.*` in new code.
 */
export const SUCCESS_COLOR = tokens.color.semantic.success;
export const ERROR_COLOR = tokens.color.semantic.error;
/** The darker accent orange (#F79133) — used for icons/text, not fills. */
export const BRAND_COLOR = tokens.color.brand.accent;
