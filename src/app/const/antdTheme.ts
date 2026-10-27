// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

import { CONTROL_RADIUS, themeTokens, type ThemeMode, type ThemeTokenName } from './themeTokens';

/** antd derives its palettes from real colors, so it takes the light value;
 *  the brand ones are the same in both modes. */
const value = (token: ThemeTokenName): string => themeTokens[token].light;

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
    // Placeholders too: antd 6 draws a Select's as a text element, which the
    // contrast audit checks, and its 25% default reads at 1.8:1 in either mode.
    colorTextPlaceholder: mode === 'light' ? 'rgba(0, 0, 0, 0.56)' : 'rgba(255, 255, 255, 0.45)',
  },
  components: {
    ...antdTheme.components,
    // Labels in the nav text color; a radio button group fills its checked
    // button with the dark on-brand label. The circle's border, dot and hover
    // live in the Radio wrapper: antd's colorBorder also draws radio button
    // borders.
    Radio: {
      ...antdTheme.components?.Radio,
      colorText: themeTokens['text/nav'][mode],
      buttonColor: themeTokens['text/nav'][mode],
    },
    ...(mode === 'light' && {
      Tag: { ...antdTheme.components?.Tag, ...LIGHT_TAG_TEXT },
      // antd draws the selected tab's label in colorPrimary, the peach that
      // reads at 1.5:1 on white. The label stays text-colored (and a hovered
      // one too); the deeper accent ink bar marks the selection.
      Tabs: {
        itemSelectedColor: themeTokens['text/primary'].light,
        itemHoverColor: themeTokens['text/secondary'].light,
        itemActiveColor: themeTokens['text/primary'].light,
        inkBarColor: value('brand/accent'),
      },
    }),
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
    colorPrimary: value('brand/muted'),
    colorPrimaryHover: value('brand/muted/hover'),
    colorPrimaryActive: value('brand/muted/active'),
    colorError: value('status/error'),
    colorSuccess: value('status/success'),
    colorLink: value('interactive/primary'),
    colorLinkHover: value('text/link/hover'),
    colorLinkActive: value('text/link/active'),
    borderRadius: CONTROL_RADIUS,
    controlOutline: value('brand/focus-ring'),
    motionDurationFast: '0.1s',
    motionDurationMid: '0.15s',
    motionDurationSlow: '0.2s',
  },
  components: {
    // antd's own primary buttons (dialog OK buttons, the back-to-top float
    // button) label the peach fill in white, which nearly vanishes on it;
    // brand fills take the dark `text/on-brand`, as the project's Button does.
    Button: {
      primaryColor: value('text/on-brand'),
    },
    // Selection controls (checkbox/radio/switch) sit on light row tints, where
    // the button peach #FFCC9C looks washed out at 16px. They use the deeper
    // primaryActive as their checked fill and the brand accent on hover.
    Switch: {
      colorPrimary: value('brand/muted/active'),
      colorPrimaryHover: value('brand/accent'),
    },
    Checkbox: {
      colorPrimary: value('brand/muted/active'),
      colorPrimaryHover: value('brand/accent'),
    },
    Radio: {
      colorPrimary: value('brand/muted/active'),
      colorPrimaryHover: value('brand/accent'),
      buttonSolidCheckedBg: value('brand/muted/active'),
      buttonSolidCheckedHoverBg: value('brand/muted/hover'),
      buttonSolidCheckedActiveBg: value('brand/muted/hover'),
      buttonSolidCheckedColor: value('text/on-brand'),
    },
    Input: {
      activeBorderColor: value('brand/muted'),
      hoverBorderColor: value('brand/muted'),
      activeShadow: `0 0 0 2px ${value('brand/focus-ring')}`,
    },
    InputNumber: {
      activeBorderColor: value('brand/muted'),
      hoverBorderColor: value('brand/muted'),
      activeShadow: `0 0 0 2px ${value('brand/focus-ring')}`,
      handleHoverColor: value('brand/muted'),
    },
    Select: {
      hoverBorderColor: value('brand/muted'),
      activeBorderColor: value('brand/muted'),
      activeOutlineColor: value('brand/focus-ring'),
      optionSelectedBg: value('brand/muted/hover'),
      optionActiveBg: value('brand/muted/hover'),
      // The peach fill stays light in dark mode, so its label has to stay dark
      // (design token `text/on-brand`) — antd's dark algorithm would otherwise
      // paint near-white text on it. The hovered option has no token of its
      // own; app.css covers that one.
      optionSelectedColor: value('text/on-brand'),
    },
    DatePicker: {
      activeBorderColor: value('brand/muted'),
      hoverBorderColor: value('brand/muted'),
      activeShadow: `0 0 0 2px ${value('brand/focus-ring')}`,
    },
  },
};
