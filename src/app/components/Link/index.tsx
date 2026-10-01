// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { tokens } from '@app/const/color';
import { cssVar, type CssVars } from '@app/const/themeTokens';

type LinkType = 'link' | 'primary' | 'secondary' | 'default';

const COMMON =
  'inline-flex items-center justify-center text-sm leading-[1.5715] whitespace-nowrap select-none cursor-pointer ' +
  'no-underline transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--link-focus)';

/** The button-like links take their colors from the variables below. */
const BUTTON_LIKE =
  `${COMMON} rounded-[4px] px-[15px] py-1 font-semibold border-solid border-(--link-border) bg-(--link-bg) ` +
  'text-(--link-text) hover:bg-(--link-bg-hover) hover:border-(--link-border-hover) ' +
  'active:bg-(--link-bg-active) active:border-(--link-border-active)';

const CLASSES: Record<LinkType, string> = {
  link:
    `${COMMON} p-0 font-medium bg-transparent border-none text-(--link-text) hover:text-(--link-text-hover) ` +
    'hover:underline active:text-(--link-text-active) focus-visible:rounded-[2px]',
  primary: `${BUTTON_LIKE} border`,
  secondary: `${BUTTON_LIKE} border-[1.5px]`,
  default: `${BUTTON_LIKE} border`,
};

const { brand, neutral, link } = tokens.color;

/** Per-type colors, from the design tokens. */
const COLORS: Record<LinkType, CssVars> = {
  link: {
    '--link-text': cssVar('text/link'),
    '--link-text-hover': link.hover,
    '--link-text-active': link.active,
    '--link-focus': link.default,
  },
  primary: {
    '--link-text': brand.onPrimary,
    '--link-bg': brand.primary,
    '--link-border': brand.primary,
    '--link-bg-hover': brand.primaryHover,
    '--link-border-hover': brand.primaryHover,
    '--link-bg-active': brand.primary,
    '--link-border-active': brand.primary,
    '--link-focus': brand.primary,
  },
  secondary: {
    '--link-text': brand.onPrimary,
    '--link-bg': 'transparent',
    '--link-border': brand.primary,
    '--link-bg-hover': brand.primaryHover,
    '--link-border-hover': brand.primaryHover,
    '--link-bg-active': brand.primaryHover,
    '--link-border-active': brand.primaryHover,
    '--link-focus': brand.primary,
  },
  default: {
    '--link-text': brand.onPrimary,
    '--link-bg': 'transparent',
    '--link-border': neutral.borderDefault,
    '--link-bg-hover': neutral.disabledBg,
    '--link-border-hover': neutral.borderDefault,
    '--link-bg-active': cssVar('bg/chip/info'),
    '--link-border-active': link.default,
    '--link-focus': brand.primary,
  },
};

export interface LinkProps extends Omit<RouterLinkProps, 'to'> {
  /** Link destination */
  to: string | { pathname: string; search?: string; hash?: string };
  /** Link/Button type */
  type?: 'link' | 'primary' | 'secondary' | 'default';
  /** Whether the link is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  loading?: boolean;
  /** Click event handler */
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Link content */
  children?: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** HTML target attribute */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** HTML rel attribute */
  rel?: string;
  /** Link size (for button types) */
  size?: 'small' | 'middle' | 'large';
  /** Whether the link should be displayed as a block */
  block?: boolean;
}

/**
 * Custom Link component with Button support
 * Can function as both a navigation link and a button with link navigation
 */
export const Link: React.FC<LinkProps> = ({
  to,
  type = 'link',
  disabled = false,
  loading = false,
  onClick,
  children,
  className,
  target,
  rel,
  size = 'middle',
  block = false,
  style,
  ...restProps
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // Add size styles for button types
  const getSizeStyles = () => {
    if (type === 'link') return {};

    const sizeMap = {
      small: { height: '24px', padding: '0px 7px', fontSize: '14px' },
      middle: { height: '32px', padding: '4px 15px', fontSize: '14px' },
      large: { height: '40px', padding: '6.4px 15px', fontSize: '16px' },
    };

    return sizeMap[size] || sizeMap.middle;
  };

  const linkProps = {
    to,
    className: [CLASSES[type], className].filter(Boolean).join(' '),
    onClick: handleClick,
    target,
    rel,
    style: {
      ...COLORS[type],
      ...getSizeStyles(),
      ...(block ? { width: '100%', display: 'flex' as const } : {}),
      ...(disabled || loading
        ? { cursor: loading ? 'wait' : 'not-allowed', opacity: 0.6, pointerEvents: 'none' as const }
        : {}),
      ...style,
    },
    'data-link-type': type,
    ...restProps,
  };

  return (
    <RouterLink {...linkProps}>
      {children}
      {loading && (
        <span className="ml-2 inline-block size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
    </RouterLink>
  );
};

export default Link;
