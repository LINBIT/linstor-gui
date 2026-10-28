// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * LINSTOR-GUI-2026 semantic theme tokens.
 *
 * Mirrors `linstor-gui-2026-design-tokens.json` (Figma file LINSTOR-GUI-2026,
 * fileKey mNxW4ZTup7rrAwkF1Y83JN, audit of node 1027:1749, 2026-07-03). Keys
 * are the exact Figma variable names from the local "Semantic" collection.
 *
 * Per the dev-handoff spec these are emitted as CSS custom properties and
 * switched at the root: light values on `:root` (default), dark values on
 * `:root[data-theme="dark"]`. Naming: `bg/nav-item/selected` →
 * `--bg-nav-item-selected`.
 *
 * This is the only color table. Use `cssVar('...')` in styles; the antd
 * theme and anything else that has to parse a color read the value itself,
 * `themeTokens[name][mode]`. Brand fills hold the same value in both modes.
 */

import type { CSSProperties } from 'react';

export const themeTokens = {
  'bg/page': { light: '#ffffff', dark: '#111111' },
  'bg/surface': { light: '#f7f7f7', dark: '#1a1a1a' },
  'bg/canvas': { light: '#666666', dark: '#333333' },
  'bg/nav': { light: '#111111', dark: '#111111' },
  'bg/nav-item/active': { light: '#ffffff', dark: '#2d2d2d' },
  'bg/nav-item/selected': { light: '#e4e4e4', dark: '#3f3f3f' },
  'bg/nav-item/hover': { light: '#f0f0f0', dark: '#2a2a2a' },
  'bg/toggle/track': { light: '#ffffff', dark: '#333333' },
  'bg/chip/info': { light: '#dbebf1', dark: '#1a3040' },
  'bg/chip/brand': { light: '#fde9d6', dark: '#3a2010' },
  'bg/chip/neutral': { light: '#d9d9d9', dark: '#3d3d3d' },
  'bg/chip/success': { light: '#e3f4d9', dark: '#1d2e14' },
  'bg/chip/warning': { light: '#fff1d6', dark: '#33280f' },
  'bg/chip/danger': { light: '#fde4e5', dark: '#3a1517' },
  'bg/button/secondary-hover': { light: '#ffdcbc', dark: '#4a2a15' },
  'bg/button/disabled': { light: '#f5f5f5', dark: 'rgba(255, 255, 255, 0.08)' },
  // The primary node's row in a resource's node table, and its hover: a
  // brand tint, light enough that the storage pool link in it stays at 4.5:1.
  'bg/row/primary': { light: '#fff4ea', dark: '#3a2010' },
  'bg/row/primary-hover': { light: '#fff1e3', dark: '#4a2a15' },
  'bg/button/default-hover': { light: '#f5f5f5', dark: 'rgba(255, 255, 255, 0.08)' },
  // A danger button fills red on hover, with a white label, in both modes.
  'bg/button/danger': { light: '#da1e28', dark: '#da1e28' },

  'text/primary': { light: '#000000', dark: '#f0f0f0' },
  'text/secondary': { light: '#3f3f3f', dark: '#eeeeee' },
  'text/nav': { light: '#111111', dark: '#e0e0e0' },
  // Muted text still reads at 4.5:1 (WCAG AA) on bg/page and bg/surface.
  'text/muted': { light: '#717171', dark: '#808080' },
  // Link text: interactive/primary is a fill; as text on white it reads at
  // only 3.1:1, so light mode takes its darker step.
  'text/link': { light: '#317792', dark: '#5aaccc' },
  'text/link/hover': { light: '#2c7fb8', dark: '#2c7fb8' },
  'text/link/active': { light: '#1e5a8a', dark: '#1e5a8a' },
  'text/on-dark': { light: '#ffffff', dark: '#ffffff' },
  // Chip labels, each 4.5:1 (WCAG AA) or better on its chip in both modes.
  'text/chip/info': { light: '#1e5a8a', dark: '#5aaccc' },
  'text/chip/success': { light: '#237804', dark: '#95de64' },
  'text/chip/warning': { light: '#874d00', dark: '#ffc130' },
  'text/chip/danger': { light: '#a8071a', dark: '#ff6b72' },
  'text/button/disabled': { light: '#bfbfbf', dark: 'rgba(255, 255, 255, 0.3)' },
  /**
   * Label/icon color on top of brand (peach) fills. The fill stays light in
   * both modes, so this must NOT flip with the theme (handoff §5 open item).
   */
  'text/on-brand': { light: '#111111', dark: '#111111' },

  'icon/default': { light: '#111111', dark: '#e0e0e0' },
  // Dark: 4.1:1 on a hovered table row (#2d2d2d), the lightest surface an
  // icon in this tone sits on; #777777 was 3.1:1 there.
  'icon/subtle': { light: '#3f3f3f', dark: '#8c8c8c' },
  'icon/muted': { light: '#888888', dark: '#808080' },
  'icon/nav-arrow': { light: '#000000', dark: '#e0e0e0' },
  'icon/on-dark': { light: '#ffffff', dark: '#ffffff' },

  'border/subtle': { light: '#eeeeee', dark: '#2e2e2e' },
  'border/default': { light: '#d9d9d9', dark: '#4a4a4a' },
  'border/strong': { light: '#cccccc', dark: '#444444' },
  'border/button/active': { light: '#da1e28', dark: '#ff5c63' },
  'border/button/inactive': { light: '#aaaaaa', dark: '#555555' },
  'border/button/disabled': { light: '#d9d9d9', dark: '#434343' },

  'brand/accent': { light: '#f79133', dark: '#f79133' },
  'brand/muted': { light: '#ffcc9c', dark: '#ffcc9c' },
  'brand/muted/hover': { light: '#ffdcbc', dark: '#ffdcbc' },
  // Also the checked fill of checkboxes, radios and switches, where the
  // lighter peach washes out at 16px.
  'brand/muted/active': { light: '#ffba80', dark: '#ffba80' },
  // Focus ring (box-shadow) around brand-bordered controls.
  'brand/focus-ring': { light: 'rgba(255, 204, 156, 0.2)', dark: 'rgba(255, 204, 156, 0.2)' },

  'interactive/primary': { light: '#499bbb', dark: '#5aaccc' },
  'interactive/primary/dark': { light: '#317792', dark: '#3a8aaa' },

  'status/success': { light: '#52c41a', dark: '#52c41a' },
  // A success check icon: clearly green, 3:1 on the page, the surface and a
  // tinted row (non-text contrast); text/chip/success is the text green.
  'icon/success': { light: '#389e0d', dark: '#52c41a' },
  'status/error': { light: '#fa4d56', dark: '#ff6b72' },
  'status/warning': { light: '#ffc130', dark: '#ffc130' },

  // A capacity meter: one ramp, the fill 3:1 against its track (WCAG 1.4.11).
  // brand/accent on the light track reads at 2:1, so light mode takes the
  // next orange down.
  'chart/meter/fill': { light: '#d46b08', dark: '#f79133' },
  'chart/meter/track': { light: '#fde9d6', dark: '#3a2010' },
} as const;

export type ThemeTokenName = keyof typeof themeTokens;

/** Corner radius of controls, in px. */
export const CONTROL_RADIUS = 4;

export type ThemeMode = 'light' | 'dark';

/** `bg/nav-item/selected` → `--bg-nav-item-selected` */
export const cssVarName = (token: ThemeTokenName): string => `--${token.replace(/\//g, '-')}`;

/** `bg/nav-item/selected` → `var(--bg-nav-item-selected)` — use in styles. */
export const cssVar = (token: ThemeTokenName): string => `var(${cssVarName(token)})`;

/** A style object that also sets custom properties (`--name: value`). */
export type CssVars = CSSProperties & Record<`--${string}`, string>;

const declarations = (mode: ThemeMode): string =>
  (Object.keys(themeTokens) as ThemeTokenName[]).map((t) => `  ${cssVarName(t)}: ${themeTokens[t][mode]};`).join('\n');

/** Full stylesheet: light on `:root`, dark on `:root[data-theme="dark"]`. */
export const themeTokensCss = (): string =>
  `:root {\n${declarations('light')}\n}\n\n:root[data-theme='dark'] {\n${declarations('dark')}\n}\n`;

const STYLE_ELEMENT_ID = 'linstor-gui-theme-tokens';

/**
 * Emit the tokens as CSS custom properties into `document.head`. Idempotent;
 * call once at startup before the app renders.
 */
export function applyThemeTokens(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = themeTokensCss();
  document.head.appendChild(style);
}

const THEME_MODE_STORAGE_KEY = '__gui__theme';

/** The persisted theme choice; defaults to light. */
export function getStoredThemeMode(): ThemeMode {
  try {
    return localStorage.getItem(THEME_MODE_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Switch the active theme by flipping `data-theme` on the root element and
 * persist the choice.
 */
export function setThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // storage unavailable (private mode etc.) — theme still applies for the session
  }
}

/** Apply the persisted theme at startup, before first paint. */
export function initThemeMode(): void {
  setThemeMode(getStoredThemeMode());
}
