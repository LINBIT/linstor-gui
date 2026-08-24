// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import styled from '@emotion/styled';
import { tokens } from '@app/const/color';
import SVG from 'react-inlinesvg';
import DeleteIcon from '@app/assets/icons/delete.svg';

/** Variants rendered by antd as-is; the brand base styling must not override
 *  their color (a link stays link-colored, a text button inherits). */
const NATIVE_VARIANTS = ['text', 'link', 'dashed'];

const StyledButton = styled(AntButton, {
  shouldForwardProp: (prop) => !['buttontype', 'isdanger'].includes(prop),
})<{
  buttontype?: 'primary' | 'secondary' | 'default' | 'text' | 'link' | 'dashed';
  isdanger?: boolean;
}>`
  /* Brand base for the filled/bordered variants; primary overrides below —
   * its brand fill stays light in both modes, so its label stays dark
   * (text/on-brand). text/link/dashed keep their antd look. */
  ${(props) =>
    !NATIVE_VARIANTS.includes(props.buttontype ?? '') &&
    `
    color: var(--text-nav) !important;
    font-weight: 600 !important;
  `}
  ${(props) => (props.shape === 'circle' || props.shape === 'round' ? '' : 'border-radius: 4px !important;')}

  /* Global disabled state */
  &:disabled,
  &.ant-btn-loading {
    background-color: ${tokens.color.neutral.disabledBg} !important;
    border-color: ${tokens.color.neutral.borderDefault} !important;
    color: ${tokens.color.neutral.disabledText} !important;
    cursor: not-allowed !important;
    opacity: 0.6 !important;

    &:hover {
      background-color: ${tokens.color.neutral.disabledBg} !important;
      border-color: ${tokens.color.neutral.borderDefault} !important;
      color: ${tokens.color.neutral.disabledText} !important;
    }
  }

  [data-theme='dark'] &:disabled,
  [data-theme='dark'] &.ant-btn-loading {
    background-color: rgba(255, 255, 255, 0.08) !important;
    border-color: #434343 !important;
    color: rgba(255, 255, 255, 0.3) !important;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
      border-color: #434343 !important;
      color: rgba(255, 255, 255, 0.3) !important;
    }
  }

  ${(props) =>
    props.buttontype === 'primary' &&
    !props.isdanger &&
    `
    color: var(--text-on-brand) !important;
    background-color: ${tokens.color.brand.primary} !important;
    border-color: ${tokens.color.brand.primary} !important;

    &:hover:not(:disabled):not(.ant-btn-loading) {
      background-color: ${tokens.color.brand.primaryHover} !important;
      border-color: ${tokens.color.brand.primaryHover} !important;
    }
  `}

  ${(props) =>
    props.buttontype === 'secondary' &&
    !props.isdanger &&
    `
    /* Hover fill is bg/button/secondary-hover — the old #FFDCBC in light,
     * a deep brown in dark (handoff §5). */
    border: 1.5px solid ${tokens.color.brand.primary} !important;

    &:hover:not(:disabled):not(.ant-btn-loading) {
      background-color: var(--bg-button-secondary-hover) !important;
      border-color: var(--bg-button-secondary-hover) !important;
    }
  `}

  ${(props) =>
    props.isdanger &&
    `
    /* Default state - red border and icon (bg follows the theme) */
    background-color: var(--bg-page) !important;
    border: 1.5px solid var(--border-button-active) !important;
    color: var(--border-button-active) !important;

    /* Hover state - solid red background */
    &:hover:not(:disabled):not(.ant-btn-loading) {
      background-color: ${tokens.color.danger.base} !important;
      border-color: ${tokens.color.danger.base} !important;
      color: #FFFFFF !important;
    }

    /* Active/Clicked state - solid red background */
    &:active:not(:disabled):not(.ant-btn-loading) {
      background-color: ${tokens.color.danger.base} !important;
      border-color: ${tokens.color.danger.base} !important;
      color: #FFFFFF !important;
    }
  `}

  /* SVG icon color inheritance */
  svg {
    fill: currentColor;
  }
`;

export interface ButtonProps extends Omit<AntButtonProps, 'type'> {
  /** Button type */
  type?: 'primary' | 'secondary' | 'default' | 'text' | 'link' | 'dashed';
  /** Whether to show loading state */
  loading?: boolean;
  /** Button size */
  size?: 'small' | 'middle' | 'large';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click event handler */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Button content */
  children?: React.ReactNode;
  /** HTML type */
  htmlType?: 'button' | 'submit' | 'reset';
  /** Danger button */
  danger?: boolean;
  /** Ghost button */
  ghost?: boolean;
  /** Button icon */
  icon?: React.ReactNode;
  /** Button shape */
  shape?: 'default' | 'circle' | 'round';
  /** Block button */
  block?: boolean;
}

/**
 * Custom Button component
 * Supports primary and secondary types, styles reference node list page's search and add buttons
 */
export const Button: React.FC<ButtonProps> = ({
  type = 'secondary',
  loading = false,
  size = 'middle',
  disabled = false,
  onClick,
  children,
  htmlType = 'button',
  danger = false,
  ghost = false,
  icon,
  shape = 'default',
  block = false,
  className,
  ...restProps
}) => {
  // Map to Ant Design button type; text/link/dashed pass through so they keep
  // their native (borderless / link-colored / dashed) rendering.
  const getAntButtonType = (): AntButtonProps['type'] => {
    if (danger) return 'primary';
    if (type === 'text' || type === 'link' || type === 'dashed') return type;
    return type === 'primary' ? 'primary' : 'default';
  };

  // Use delete icon for danger buttons if no icon is provided and button has text
  const buttonIcon = danger && !icon && children ? <SVG src={DeleteIcon} width={13} height={14} /> : icon;

  return (
    <StyledButton
      buttontype={type}
      isdanger={danger}
      type={getAntButtonType()}
      loading={loading}
      size={size}
      disabled={disabled}
      onClick={onClick}
      htmlType={htmlType}
      danger={danger}
      ghost={ghost}
      icon={buttonIcon}
      shape={shape}
      block={block}
      className={className}
      {...restProps}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
