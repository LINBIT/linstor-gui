// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Checkbox as AntCheckbox, CheckboxProps as AntCheckboxProps } from 'antd';
import styled from '@emotion/styled';

const StyledCheckbox = styled(AntCheckbox)`
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #ffcc9c !important;
    border-color: #ffcc9c !important;
  }

  .ant-checkbox-checked::after {
    border-color: #ffcc9c !important;
  }

  .ant-checkbox-wrapper:hover .ant-checkbox-inner,
  .ant-checkbox:hover .ant-checkbox-inner,
  .ant-checkbox-input:focus + .ant-checkbox-inner {
    border-color: #ffcc9c !important;
  }

  .ant-checkbox-checked .ant-checkbox-inner::after {
    border-color: #111111 !important;
  }

  &.ant-checkbox-wrapper-checked {
    .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #ffcc9c !important;
      border-color: #ffcc9c !important;
    }

    &:hover .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #ffdcbc !important;
      border-color: #ffdcbc !important;
    }
  }

  .ant-checkbox-wrapper:hover .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #ffdcbc !important;
    border-color: #ffdcbc !important;
  }
`;

export interface CheckboxProps extends Omit<AntCheckboxProps, 'checked' | 'defaultChecked'> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Change callback */
  onChange?: (e: any) => void;
  /** Checkbox content */
  children?: React.ReactNode;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Auto focus */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** HTML id */
  id?: string;
  /** HTML value attribute */
  value?: any;
}

/**
 * Custom Checkbox component
 * Features custom color scheme with #FFCC9C as the primary color
 * Based on Ant Design Checkbox with custom styling
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  children,
  indeterminate = false,
  autoFocus = false,
  className,
  style,
  id,
  value,
  ...restProps
}) => {
  return (
    <StyledCheckbox
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      indeterminate={indeterminate}
      autoFocus={autoFocus}
      className={className}
      style={style}
      id={id}
      value={value}
      {...restProps}
    >
      {children}
    </StyledCheckbox>
  );
};

export default Checkbox;
