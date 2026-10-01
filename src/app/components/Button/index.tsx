// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import styled from '@emotion/styled';
import { tokens } from '@app/const/color';

/** Trash icon of danger buttons. Inline rather than fetched (react-inlinesvg):
 *  a fetched icon arrives a frame after the button and widens it, which
 *  re-wrapped the storage pool search row and shifted the page. */
const DeleteIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      d="M2.33334 14C1.90556 14 1.53948 13.8478 1.23511 13.5434C0.930743 13.2391 0.778299 12.8727 0.77778 12.4444V2.33333C0.55741 2.33333 0.372818 2.25867 0.224003 2.10933C0.075188 1.96 0.0005212 1.77541 2.68199e-06 1.55556C-0.000515836 1.3357 0.0741509 1.15111 0.224003 1.00178C0.373855 0.852444 0.558447 0.777778 0.77778 0.777778H3.88889C3.88889 0.557407 3.96356 0.372815 4.11289 0.224C4.26222 0.0751853 4.44682 0.000518518 4.66667 0H7.77778C7.99815 0 8.183 0.0746667 8.33234 0.224C8.48167 0.373333 8.55608 0.557926 8.55556 0.777778H11.6667C11.887 0.777778 12.0719 0.852444 12.2212 1.00178C12.3706 1.15111 12.445 1.3357 12.4444 1.55556C12.4439 1.77541 12.3693 1.96026 12.2204 2.11011C12.0716 2.25996 11.887 2.33437 11.6667 2.33333V12.4444C11.6667 12.8722 11.5145 13.2386 11.2101 13.5434C10.9057 13.8483 10.5394 14.0005 10.1111 14H2.33334ZM10.1111 2.33333H2.33334V12.4444H10.1111V2.33333ZM4.66667 10.8889C4.88704 10.8889 5.07189 10.8142 5.22122 10.6649C5.37056 10.5156 5.44497 10.331 5.44445 10.1111V4.66667C5.44445 4.4463 5.36978 4.2617 5.22045 4.11289C5.07111 3.96407 4.88652 3.88941 4.66667 3.88889C4.44682 3.88837 4.26222 3.96304 4.11289 4.11289C3.96356 4.26274 3.88889 4.44733 3.88889 4.66667V10.1111C3.88889 10.3315 3.96356 10.5163 4.11289 10.6657C4.26222 10.815 4.44682 10.8894 4.66667 10.8889ZM7.77778 10.8889C7.99815 10.8889 8.183 10.8142 8.33234 10.6649C8.48167 10.5156 8.55608 10.331 8.55556 10.1111V4.66667C8.55556 4.4463 8.48089 4.2617 8.33156 4.11289C8.18222 3.96407 7.99763 3.88941 7.77778 3.88889C7.55793 3.88837 7.37334 3.96304 7.224 4.11289C7.07467 4.26274 7 4.44733 7 4.66667V10.1111C7 10.3315 7.07467 10.5163 7.224 10.6657C7.37334 10.815 7.55793 10.8894 7.77778 10.8889Z"
    />
  </svg>
);

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
 * Supports primary and secondary types, styles reference node list page's search and add buttons.
 * Forwards its ref: as the child of a Dropdown/Popover/Tooltip the trigger
 * needs the DOM node, and without a ref antd falls back to findDOMNode.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
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
  },
  ref,
) {
  // Map to Ant Design button type; text/link/dashed pass through so they keep
  // their native (borderless / link-colored / dashed) rendering.
  const getAntButtonType = (): AntButtonProps['type'] => {
    if (danger) return 'primary';
    if (type === 'text' || type === 'link' || type === 'dashed') return type;
    return type === 'primary' ? 'primary' : 'default';
  };

  // Use delete icon for danger buttons if no icon is provided and button has text
  const buttonIcon = danger && !icon && children ? <DeleteIcon /> : icon;

  return (
    <StyledButton
      ref={ref}
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
});

export default Button;
