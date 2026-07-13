// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

import { tokens } from './color';
import type { ThemeMode } from './themeTokens';

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
    ...(mode === 'dark' && {
      colorBgBase: '#111111',
      colorTextBase: '#f0f0f0',
    }),
  },
});

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
    Switch: {
      colorPrimary: tokens.color.brand.primary,
      colorPrimaryHover: tokens.color.brand.primaryHover,
    },
    Checkbox: {
      colorPrimary: tokens.color.brand.primary,
      colorPrimaryHover: tokens.color.brand.primaryHover,
    },
    Radio: {
      colorPrimary: tokens.color.brand.primary,
      colorPrimaryHover: tokens.color.brand.primaryHover,
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
    },
    DatePicker: {
      activeBorderColor: tokens.color.brand.primary,
      hoverBorderColor: tokens.color.brand.primary,
      activeShadow: `0 0 0 2px ${tokens.focusRing}`,
    },
  },
};
