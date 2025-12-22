// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import styled from '@emotion/styled';
import SVG from 'react-inlinesvg';
import DeleteIcon from '@app/assets/icons/delete.svg';

const StyledButton = styled(AntButton, {
  shouldForwardProp: (prop) => !['buttontype', 'isdanger'].includes(prop),
})<{
  buttontype?: 'primary' | 'secondary' | 'default' | 'text' | 'link' | 'dashed';
  isdanger?: boolean;
}>`
  color: #111111 !important;
  font-weight: 600 !important;
  border-radius: 4px !important;

  ${(props) =>
    props.buttontype === 'primary' &&
    !props.isdanger &&
    `
    background-color: #FFCC9C !important;
    border-color: #FFCC9C !important;

    &:hover {
      background-color: #FFDCBC !important;
      border-color: #FFDCBC !important;
    }
  `}

  ${(props) =>
    props.buttontype === 'secondary' &&
    !props.isdanger &&
    `
    border: 1.5px solid #FFCC9C !important;

    &:hover {
      background-color: #FFDCBC !important;
      border-color: #FFDCBC !important;
    }
  `}

  ${(props) =>
    props.isdanger &&
    `
    /* Default state - red border and icon */
    background-color: #FFFFFF !important;
    border: 1.5px solid #DA1E28 !important;
    color: #DA1E28 !important;

    /* Hover state - solid red background */
    &:hover:not(:disabled) {
      background-color: #DA1E28 !important;
      border-color: #DA1E28 !important;
      color: #FFFFFF !important;
    }

    /* Active/Clicked state - solid red background */
    &:active:not(:disabled) {
      background-color: #DA1E28 !important;
      border-color: #DA1E28 !important;
      color: #FFFFFF !important;
    }

    /* Disabled state - gray border */
    &:disabled {
      background-color: #FFFFFF !important;
      border-color: #AAAAAA !important;
      color: #AAAAAA !important;
      cursor: not-allowed;
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
  // Map to Ant Design button type
  const getAntButtonType = (): AntButtonProps['type'] => {
    if (danger) return 'primary';
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
