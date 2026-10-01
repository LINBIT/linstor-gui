// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Switch as AntSwitch, SwitchProps as AntSwitchProps } from 'antd';
/** A checked switch's label (checkedChildren) on the peach track: black,
 *  semibold, 12/20. The track colors come from the Switch tokens. */
const CHECKED_LABEL = [
  '[&.ant-switch-checked_.ant-switch-inner]:text-black',
  '[&.ant-switch-checked_.ant-switch-inner_*]:text-black',
  '[&.ant-switch-checked_.ant-switch-inner]:font-semibold',
  '[&.ant-switch-checked_.ant-switch-inner]:text-xs',
  '[&.ant-switch-checked_.ant-switch-inner]:leading-5',
].join(' ');

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
  size?: 'small' | 'medium';
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
 * antd's Switch under the project name; the track colors come from the Switch
 * tokens, the checked label from the class above.
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  checkedChildren,
  unCheckedChildren,
  size = 'medium',
  loading = false,
  autoFocus = false,
  className,
  style,
  id,
  ...restProps
}) => {
  return (
    <AntSwitch
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      checkedChildren={checkedChildren}
      unCheckedChildren={unCheckedChildren}
      size={size}
      loading={loading}
      autoFocus={autoFocus}
      className={[CHECKED_LABEL, className].filter(Boolean).join(' ')}
      style={style}
      id={id}
      {...restProps}
    />
  );
};

export default Switch;
