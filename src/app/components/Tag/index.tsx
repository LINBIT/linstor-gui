// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Tag as AntTag, TagProps as AntTagProps } from 'antd';

import { cssVar, type ThemeTokenName } from '@app/const/themeTokens';

/**
 * What a tag says rather than which color it is:
 * - `highlight` the active or deployed item, in the solid brand fill
 * - `brand` a brand marker, such as the node the controller runs on
 * - `info`, `success`, `warning`, `danger` a state
 * - `neutral` a plain label
 */
export type TagTone = 'highlight' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<TagTone, { bg: ThemeTokenName; text: ThemeTokenName; border?: ThemeTokenName }> = {
  highlight: { bg: 'brand/muted', text: 'text/on-brand' },
  brand: { bg: 'bg/chip/brand', text: 'text/primary' },
  info: { bg: 'bg/chip/info', text: 'text/chip/info' },
  success: { bg: 'bg/chip/success', text: 'text/chip/success' },
  warning: { bg: 'bg/chip/warning', text: 'text/chip/warning' },
  danger: { bg: 'bg/chip/danger', text: 'text/chip/danger' },
  // Outlined on the surface color: a node link in it still reads at 4.5:1,
  // which it does not on the filled neutral chip.
  neutral: { bg: 'bg/surface', text: 'text/primary', border: 'border/default' },
};

export interface TagProps extends Omit<AntTagProps, 'color' | 'variant'> {
  /** Defaults to `neutral`. */
  tone?: TagTone;
}

/**
 * antd's Tag in the theme's chip colors, light and dark. Forwards its ref, so
 * it can be a Tooltip's child.
 */
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { tone = 'neutral', style, ...props },
  ref,
) {
  const { bg, text, border } = TONES[tone];
  return (
    <AntTag
      ref={ref}
      variant="filled"
      data-tone={tone}
      style={{
        background: cssVar(bg),
        color: cssVar(text),
        borderColor: border ? cssVar(border) : 'transparent',
        ...style,
      }}
      {...props}
    />
  );
});

export default Tag;
