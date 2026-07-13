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
 * This table complements `color.ts` (brand palette for the component
 * primitives / antd theme): `brand/accent` here equals `tokens.color.brand
 * .accent` (#F79133) and `brand/muted` equals `tokens.color.brand.primary`
 * (#FFCC9C). Use `cssVar('...')` for surfaces/text that must follow the
 * light/dark mode; keep using `color.ts` for the mode-independent brand fills.
 */

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
  'bg/button/secondary-hover': { light: '#ffdcbc', dark: '#4a2a15' },

  'text/primary': { light: '#000000', dark: '#f0f0f0' },
  'text/secondary': { light: '#3f3f3f', dark: '#eeeeee' },
  'text/nav': { light: '#111111', dark: '#e0e0e0' },
  'text/muted': { light: '#888888', dark: '#808080' },
  'text/on-dark': { light: '#ffffff', dark: '#ffffff' },
  /**
   * Label/icon color on top of brand (peach) fills. The fill stays light in
   * both modes, so this must NOT flip with the theme (handoff §5 open item).
   */
  'text/on-brand': { light: '#111111', dark: '#111111' },

  'icon/default': { light: '#111111', dark: '#e0e0e0' },
  'icon/subtle': { light: '#3f3f3f', dark: '#777777' },
  'icon/muted': { light: '#888888', dark: '#808080' },
  'icon/nav-arrow': { light: '#000000', dark: '#e0e0e0' },
  'icon/on-dark': { light: '#ffffff', dark: '#ffffff' },

  'border/subtle': { light: '#eeeeee', dark: '#2e2e2e' },
  'border/default': { light: '#d9d9d9', dark: '#4a4a4a' },
  'border/strong': { light: '#cccccc', dark: '#444444' },
  'border/button/active': { light: '#da1e28', dark: '#ff5c63' },
  'border/button/inactive': { light: '#aaaaaa', dark: '#555555' },

  'brand/accent': { light: '#f79133', dark: '#f79133' },
  'brand/muted': { light: '#ffcc9c', dark: '#ffcc9c' },

  'interactive/primary': { light: '#499bbb', dark: '#5aaccc' },
  'interactive/primary/dark': { light: '#317792', dark: '#3a8aaa' },

  'status/error': { light: '#fa4d56', dark: '#ff6b72' },
  'status/warning': { light: '#ffc130', dark: '#ffc130' },
} as const;

export type ThemeTokenName = keyof typeof themeTokens;

export type ThemeMode = 'light' | 'dark';

/** `bg/nav-item/selected` → `--bg-nav-item-selected` */
export const cssVarName = (token: ThemeTokenName): string => `--${token.replace(/\//g, '-')}`;

/** `bg/nav-item/selected` → `var(--bg-nav-item-selected)` — use in styles. */
export const cssVar = (token: ThemeTokenName): string => `var(${cssVarName(token)})`;

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
