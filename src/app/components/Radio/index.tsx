// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Radio as AntRadio, RadioProps as AntRadioProps, RadioGroupProps as AntRadioGroupProps } from 'antd';
import { tokens } from '@app/const/color';
import type { CssVars } from '@app/const/themeTokens';
/** A checked radio button reads semibold on its peach fill; fill, label and
 *  hover colors come from the Radio tokens (the solid button style). */
const CHECKED_BUTTON = '[&_.ant-radio-button-wrapper-checked]:font-semibold';

// A checked circle is outlined in the deeper brand peach around a brand dot on
// the page color; hovering it lightens border and dot (antd would fill it with
// colorPrimaryHover). A standalone Radio outlines its unchecked circle in the
// brand peach too; in a group the unchecked ones stay grey until hovered.
// Disabled radios keep antd's look. The hover rules name the circle twice to
// outrank the unchecked-hover border; class names are spelled out in full, as
// Tailwind only generates what it finds in the source.
const SELF = [
  '[&_.ant-radio-checked:not(.ant-radio-disabled)]:border-(--radio-brand)',
  '[&_.ant-radio-checked:not(.ant-radio-disabled)]:bg-(--bg-page)',
  '[&_.ant-radio-checked:not(.ant-radio-disabled)]:after:bg-(--radio-brand)',
  '[&_.ant-radio:not(.ant-radio-disabled)]:border-(--radio-brand)',
  '[&:hover_.ant-radio.ant-radio-checked:not(.ant-radio-disabled)]:border-(--radio-brand-hover)',
  '[&:hover_.ant-radio.ant-radio-checked:not(.ant-radio-disabled)]:bg-(--bg-page)',
  '[&:hover_.ant-radio.ant-radio-checked:not(.ant-radio-disabled)]:after:bg-(--radio-brand-hover)',
].join(' ');
const IN_GROUP = [
  '[&_.ant-radio-checked:not(.ant-radio-disabled)]:border-(--radio-brand)',
  '[&_.ant-radio-checked:not(.ant-radio-disabled)]:bg-(--bg-page)',
  '[&_.ant-radio-checked:not(.ant-radio-disabled)]:after:bg-(--radio-brand)',
  '[&_.ant-radio-wrapper:hover_.ant-radio:not(.ant-radio-disabled)]:border-(--radio-brand)',
  '[&_.ant-radio-wrapper:hover_.ant-radio.ant-radio-checked:not(.ant-radio-disabled)]:border-(--radio-brand-hover)',
  '[&_.ant-radio-wrapper:hover_.ant-radio.ant-radio-checked:not(.ant-radio-disabled)]:bg-(--bg-page)',
  '[&_.ant-radio-wrapper:hover_.ant-radio.ant-radio-checked:not(.ant-radio-disabled)]:after:bg-(--radio-brand-hover)',
].join(' ');

const brandVars = (style?: React.CSSProperties): CssVars => ({
  '--radio-brand': tokens.color.brand.primaryActive,
  '--radio-brand-hover': tokens.color.brand.primaryHover,
  ...style,
});

export interface RadioProps extends Omit<AntRadioProps, 'checked' | 'defaultChecked'> {
  /** Whether the radio is checked */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Radio content */
  children?: React.ReactNode;
  /** Auto focus */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

export interface RadioGroupProps extends AntRadioGroupProps {
  /** Whether the radio group is disabled */
  disabled?: boolean;
  /** Radio group children */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Layout direction */
  optionType?: 'default' | 'button';
  /** Button style (only works when optionType is button). Defaults to 'solid': the brand's checked button is the filled one */
  buttonStyle?: 'outline' | 'solid';
  /** Size of radio buttons */
  size?: 'large' | 'middle' | 'small';
}

/**
 * antd's Radio under the project name: the brand circle and its hover come
 * from the classes above, label and dot colors from the Radio tokens.
 */
export const Radio: React.FC<RadioProps> & {
  Group: React.FC<RadioGroupProps>;
  Button: typeof AntRadio.Button;
} = ({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  children,
  autoFocus = false,
  className,
  style,
  value,
  ...restProps
}) => {
  return (
    <AntRadio
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      autoFocus={autoFocus}
      className={[SELF, className].filter(Boolean).join(' ')}
      style={brandVars(style)}
      value={value}
      {...restProps}
    >
      {children}
    </AntRadio>
  );
};

/**
 * antd's Radio.Group, styled like Radio for the radios it renders itself
 * (`options`), with the brand fill on a checked radio button.
 */
const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  disabled = false,
  onChange,
  options,
  children,
  className,
  style,
  optionType = 'default',
  buttonStyle = 'solid',
  size = 'middle',
  ...restProps
}) => {
  return (
    <AntRadio.Group
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={onChange}
      options={options}
      className={[CHECKED_BUTTON, IN_GROUP, className].filter(Boolean).join(' ')}
      style={brandVars(style)}
      optionType={optionType}
      buttonStyle={buttonStyle}
      size={size}
      {...restProps}
    >
      {children}
    </AntRadio.Group>
  );
};

Radio.Group = RadioGroup;
Radio.Button = AntRadio.Button;

export default Radio;
