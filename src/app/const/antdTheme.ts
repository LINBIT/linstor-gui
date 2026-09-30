// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

import { tokens } from './color';
import { themeTokens, type ThemeMode } from './themeTokens';

/**
 * antd theme derived from the design tokens.
 *
 * Setting these global + per-component tokens means native antd components
 * (the ones not wrapped by an `@app/components/*` primitive) also pick up the
 * brand color, so the look stays consistent without wrapping every component.
 */
/**
 * The antd theme for a given light/dark mode. Dark mode switches to antd's
 * dark algorithm (containers, tables, inputs, typography all derive dark
 * variants automatically) with the base colors anchored to the design tokens
 * (`bg/page` dark #111, `text/primary` dark #f0f0f0). The brand peach fills
 * stay identical in both modes by design.
 */
export const getAntdTheme = (mode: ThemeMode): ThemeConfig => ({
  ...antdTheme,
  algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    ...antdTheme.token,
    colorLink: themeTokens['text/link'][mode],
    ...(mode === 'dark' && {
      colorBgBase: '#111111',
      colorTextBase: '#f0f0f0',
    }),
    // Descriptions and empty states read at 4.5:1 (WCAG AA); antd's 45% black
    // is 3.4:1. The dark algorithm's own value already passes.
    ...(mode === 'light' && { colorTextDescription: 'rgba(0, 0, 0, 0.56)' }),
  },
  components: {
    ...antdTheme.components,
    ...(mode === 'light' && { Tag: { ...antdTheme.components?.Tag, ...LIGHT_TAG_TEXT } }),
  },
});

/**
 * Tag text on its tinted background at 4.5:1 (WCAG AA). antd writes a preset
 * tag in shade 7 of its palette and a status tag in the status color itself,
 * both too light for these; they take the next shade that passes. Light mode
 * only: the dark algorithm derives its own palette.
 */
const LIGHT_TAG_TEXT = {
  volcano7: '#ad2102',
  orange7: '#ad4e00',
  gold7: '#874d00',
  yellow7: '#876800',
  lime7: '#3f6600',
  green7: '#237804',
  cyan7: '#006d75',
  colorSuccess: '#237804',
  colorInfo: '#003eb3',
  colorWarning: '#874d00',
  colorError: '#a8071a',
};

export const antdTheme: ThemeConfig = {
  token: {
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    colorPrimary: tokens.color.brand.primary,
    colorPrimaryHover: tokens.color.brand.primaryHover,
    colorPrimaryActive: tokens.color.brand.primaryActive,
    colorError: tokens.color.semantic.error,
    colorSuccess: tokens.color.semantic.success,
    colorLink: tokens.color.link.default,
    colorLinkHover: tokens.color.link.hover,
    colorLinkActive: tokens.color.link.active,
    borderRadius: tokens.radius,
    controlOutline: tokens.focusRing,
  },
  components: {
    // Selection controls (checkbox/radio/switch) sit on light row tints, where
    // the button peach #FFCC9C looks washed out at 16px. They use the deeper
    // primaryActive as their checked fill and the brand accent on hover.
    Switch: {
      colorPrimary: tokens.color.brand.primaryActive,
      colorPrimaryHover: tokens.color.brand.accent,
    },
    Checkbox: {
      colorPrimary: tokens.color.brand.primaryActive,
      colorPrimaryHover: tokens.color.brand.accent,
    },
    Radio: {
      colorPrimary: tokens.color.brand.primaryActive,
      colorPrimaryHover: tokens.color.brand.accent,
    },
    Input: {
      activeBorderColor: tokens.color.brand.primary,
      hoverBorderColor: tokens.color.brand.primary,
      activeShadow: `0 0 0 2px ${tokens.focusRing}`,
    },
    InputNumber: {
      activeBorderColor: tokens.color.brand.primary,
      hoverBorderColor: tokens.color.brand.primary,
      activeShadow: `0 0 0 2px ${tokens.focusRing}`,
    },
    Select: {
      optionSelectedBg: tokens.color.brand.primaryHover,
      optionActiveBg: tokens.color.brand.primaryHover,
      // The peach fill stays light in dark mode, so its label has to stay dark
      // (design token `text/on-brand`) — antd's dark algorithm would otherwise
      // paint near-white text on it. The hovered option has no token of its
      // own; app.css covers that one.
      optionSelectedColor: tokens.color.brand.onPrimary,
    },
    // A primary FloatButton (back-to-top) is filled with the peach
    // colorPrimary but draws its icon in colorTextLightSolid (white), which
    // nearly vanishes on it; brand fills take the dark `text/on-brand`.
    FloatButton: {
      colorTextLightSolid: tokens.color.brand.onPrimary,
    },
    DatePicker: {
      activeBorderColor: tokens.color.brand.primary,
      hoverBorderColor: tokens.color.brand.primary,
      activeShadow: `0 0 0 2px ${tokens.focusRing}`,
    },
  },
};
