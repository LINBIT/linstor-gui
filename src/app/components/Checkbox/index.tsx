// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Checkbox as AntCheckbox, CheckboxProps as AntCheckboxProps } from 'antd';
import type { CheckboxRef } from 'antd';
import styled from '@emotion/styled';
import { tokens } from '@app/const/color';

// antd 6 draws the box on .ant-checkbox itself and colours its fill, border
// and hover from the Checkbox theme tokens (brand primaryActive / accent). The
// tick, its ::after, takes the brand's text colour: white is barely visible on
// the light peach fill.
const StyledCheckbox = styled(AntCheckbox)`
  .ant-checkbox.ant-checkbox-checked::after {
    border-color: ${tokens.color.brand.onPrimary} !important;
  }
`;

// value and onChange come typed from the antd props this extends.
export interface CheckboxProps extends Omit<AntCheckboxProps, 'checked' | 'defaultChecked'> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
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
}

/**
 * Custom Checkbox component
 * Features custom color scheme with ${tokens.color.brand.primaryActive} as the primary color
 * Based on Ant Design Checkbox with custom styling. Forwards its ref, so it
 * can be a Tooltip's child without antd falling back to findDOMNode.
 */
export const Checkbox = React.forwardRef<CheckboxRef, CheckboxProps>(function Checkbox(
  {
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
  },
  ref,
) {
  return (
    <StyledCheckbox
      ref={ref}
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
});

export default Checkbox;
