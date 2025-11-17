// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import styled from '@emotion/styled';

const StyledLink = styled(RouterLink, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{
  $linkType?: 'link' | 'primary' | 'secondary' | 'default';
  $loading?: boolean;
  $disabled?: boolean;
}>`
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 15px;
  font-size: 14px;
  line-height: 1.5715;
  user-select: none;
  white-space: nowrap;

  ${(props) => {
    if (props.$linkType === 'primary') {
      return `
        background-color: #FFCC9C !important;
        border-color: #FFCC9C !important;
        color: #111111 !important;
        border: 1px solid #d9d9d9;

        &:hover:not(:disabled) {
          background-color: #FFDCBC !important;
          border-color: #FFDCBC !important;
        }

        &:active:not(:disabled) {
          background-color: #FFCC9C !important;
          border-color: #FFCC9C !important;
        }
      `;
    }

    if (props.$linkType === 'secondary') {
      return `
        background-color: transparent !important;
        border: 1.5px solid #FFCC9C !important;
        color: #111111 !important;

        &:hover:not(:disabled) {
          background-color: #FFDCBC !important;
          border-color: #FFDCBC !important;
        }

        &:active:not(:disabled) {
          background-color: #FFDCBC !important;
          border-color: #FFDCBC !important;
        }
      `;
    }

    if (props.$linkType === 'default') {
      return `
        background-color: transparent !important;
        border: 1px solid #d9d9d9 !important;
        color: #111111 !important;

        &:hover:not(:disabled) {
          background-color: #f5f5f5 !important;
          border-color: #d9d9d9 !important;
        }

        &:active:not(:disabled) {
          background-color: #e6f7ff !important;
          border-color: #4096ff !important;
        }
      `;
    }

    // Default link style
    return `
      color: #499BBB !important;
      font-weight: 500;
      padding: 0;
      background: transparent !important;
      border: none !important;

      &:hover:not(:disabled) {
        color: #2c7fb8 !important;
        text-decoration: underline;
      }

      &:active:not(:disabled) {
        color: #1e5a8a !important;
      }
    `;
  }}

  &:focus {
    outline: 2px solid ${(props) => (props.$linkType === 'link' ? '#499BBB' : '#FFCC9C')};
    outline-offset: 2px;
    border-radius: ${(props) => (props.$linkType === 'link' ? '2px' : '4px')};
  }

  ${(props) =>
    props.$disabled &&
    `
    cursor: not-allowed !important;
    opacity: 0.6;
    pointer-events: none;
  `}

  ${(props) =>
    props.$loading &&
    `
    cursor: wait !important;
    pointer-events: none;
  `}
`;

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
    className,
    onClick: handleClick,
    target,
    rel,
    style: {
      ...getSizeStyles(),
      ...(block ? { width: '100%', display: 'flex' } : {}),
      ...(disabled || loading ? { cursor: 'not-allowed', opacity: 0.6, pointerEvents: 'none' } : {}),
    },
    'data-link-type': type,
    ...restProps,
  };

  return (
    <>
      <style>
        {`
          @keyframes link-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <StyledLink $linkType={type} $loading={loading} $disabled={disabled} {...linkProps}>
        {children}
        {loading && (
          <span
            style={{
              marginLeft: '8px',
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'link-spin 1s linear infinite',
            }}
          />
        )}
      </StyledLink>
    </>
  );
};

export default Link;
