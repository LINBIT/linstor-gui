// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Checkbox as AntCheckbox, CheckboxProps as AntCheckboxProps } from 'antd';
import type { CheckboxRef } from 'antd';

// antd 6 draws the box on .ant-checkbox itself and colours its fill, border
// and hover from the Checkbox theme tokens (brand primaryActive / accent). The
// tick, its ::after, takes the brand's text colour: white is barely visible on
// the light peach fill. Only the project's checkboxes: a table's row
// selection keeps antd's white tick, and a disabled one antd's grey tick.
const TICK = '[&_.ant-checkbox-checked:not(.ant-checkbox-disabled)]:after:border-(--text-on-brand)';

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
 * antd's Checkbox under the project name with the dark tick above. Forwards
 * its ref, so it can be a Tooltip's child without antd falling back to
 * findDOMNode.
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
    <AntCheckbox
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      indeterminate={indeterminate}
      autoFocus={autoFocus}
      className={[TICK, className].filter(Boolean).join(' ')}
      style={style}
      id={id}
      value={value}
      {...restProps}
    >
      {children}
    </AntCheckbox>
  );
});

export default Checkbox;
