// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Switch as AntSwitch, SwitchProps as AntSwitchProps } from 'antd';
import styled from '@emotion/styled';

const StyledSwitch = styled(AntSwitch)`
  &.ant-switch-checked {
    background-color: #ffcc9c !important;
    border-color: #ffcc9c !important;

    .ant-switch-inner {
      color: #111111 !important;
      font-weight: 600 !important;
      font-size: 12px !important;
      line-height: 20px !important;
    }

    &:hover:not(.ant-switch-disabled) {
      background-color: #ffdcbc !important;
      border-color: #ffdcbc !important;
    }
  }

  &:hover:not(.ant-switch-disabled):not(.ant-switch-checked) {
    border-color: #ffcc9c !important;
  }
`;

export interface SwitchProps extends Omit<AntSwitchProps, 'checkedChildren' | 'unCheckedChildren'> {
  /** Whether the switch is checked */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Change callback */
  onChange?: (
    checked: boolean,
    event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  /** Content to show when switch is checked */
  checkedChildren?: React.ReactNode;
  /** Content to show when switch is unchecked */
  unCheckedChildren?: React.ReactNode;
  /** Switch size */
  size?: 'small' | 'default';
  /** Loading state */
  loading?: boolean;
  /** Auto focus */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** HTML id */
  id?: string;
}

/**
 * Custom Switch component
 * Features custom color scheme with #FFCC9C as the primary color
 * Based on Ant Design Switch with custom styling
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  checkedChildren,
  unCheckedChildren,
  size = 'default',
  loading = false,
  autoFocus = false,
  className,
  style,
  id,
  ...restProps
}) => {
  return (
    <StyledSwitch
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      checkedChildren={checkedChildren}
      unCheckedChildren={unCheckedChildren}
      size={size}
      loading={loading}
      autoFocus={autoFocus}
      className={className}
      style={style}
      id={id}
      {...restProps}
    />
  );
};

export default Switch;
