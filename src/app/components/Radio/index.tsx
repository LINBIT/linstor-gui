// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Radio as AntRadio, RadioProps as AntRadioProps, RadioGroupProps as AntRadioGroupProps } from 'antd';
import styled from '@emotion/styled';
import { tokens } from '@app/const/color';

const StyledRadio = styled(AntRadio)`
  && {
    color: var(--text-nav) !important;
  }

  &.ant-radio-wrapper {
    color: var(--text-nav) !important;
  }

  .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio-checked .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
    background-color: var(--bg-page) !important;
  }

  .ant-radio-checked .ant-radio-inner::after {
    background-color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio:hover .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio-input:focus + .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
    box-shadow: 0 0 0 3px rgba(255, 204, 156, 0.1) !important;
  }

  &.ant-radio-wrapper:hover .ant-radio,
  &.ant-radio-wrapper:hover .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
  }

  &.ant-radio-wrapper-checked {
    .ant-radio-checked .ant-radio-inner {
      border-color: ${tokens.color.brand.primary} !important;
    }

    .ant-radio-checked .ant-radio-inner::after {
      background-color: ${tokens.color.brand.primary} !important;
    }

    &:hover .ant-radio-checked .ant-radio-inner {
      border-color: ${tokens.color.brand.primaryHover} !important;
    }

    &:hover .ant-radio-checked .ant-radio-inner::after {
      background-color: ${tokens.color.brand.primaryHover} !important;
    }
  }
`;

const StyledRadioGroup = styled(AntRadio.Group)`
  && .ant-radio-wrapper {
    color: var(--text-nav) !important;
  }

  .ant-radio-wrapper span {
    color: var(--text-nav) !important;
  }

  .ant-radio-checked .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
    background-color: var(--bg-page) !important;
  }

  .ant-radio-checked .ant-radio-inner::after {
    background-color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio:hover .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio-input:focus + .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
    box-shadow: 0 0 0 3px rgba(255, 204, 156, 0.1) !important;
  }

  .ant-radio-wrapper:hover .ant-radio,
  .ant-radio-wrapper:hover .ant-radio-inner {
    border-color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio-wrapper-checked {
    .ant-radio-checked .ant-radio-inner {
      border-color: ${tokens.color.brand.primary} !important;
    }

    .ant-radio-checked .ant-radio-inner::after {
      background-color: ${tokens.color.brand.primary} !important;
    }

    &:hover .ant-radio-checked .ant-radio-inner {
      border-color: ${tokens.color.brand.primaryHover} !important;
    }

    &:hover .ant-radio-checked .ant-radio-inner::after {
      background-color: ${tokens.color.brand.primaryHover} !important;
    }
  }

  && .ant-radio-button-wrapper {
    color: var(--text-nav) !important;
  }

  .ant-radio-button-wrapper span {
    color: var(--text-nav) !important;
  }

  .ant-radio-button-wrapper-checked {
    background-color: ${tokens.color.brand.primary} !important;
    border-color: ${tokens.color.brand.primary} !important;
    color: ${tokens.color.brand.onPrimary} !important;
    font-weight: 600 !important;

    &:hover {
      background-color: ${tokens.color.brand.primaryHover} !important;
      border-color: ${tokens.color.brand.primaryHover} !important;
      color: ${tokens.color.brand.onPrimary} !important;
    }

    &::before {
      background-color: ${tokens.color.brand.primary} !important;
    }
  }

  .ant-radio-button-wrapper-checked span {
    color: ${tokens.color.brand.onPrimary} !important;
  }

  .ant-radio-button-wrapper:hover {
    color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio-button-wrapper:hover span {
    color: ${tokens.color.brand.primary} !important;
  }

  .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):focus-within {
    box-shadow: 0 0 0 3px rgba(255, 204, 156, 0.1) !important;
  }
`;

export interface RadioProps extends Omit<AntRadioProps, 'checked' | 'defaultChecked'> {
  /** Whether the radio is checked */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Change callback */
  onChange?: (e: any) => void;
  /** Radio content */
  children?: React.ReactNode;
  /** Auto focus */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** HTML value attribute */
  value?: any;
}

export interface RadioGroupProps extends AntRadioGroupProps {
  /** Current selected value */
  value?: any;
  /** Default selected value */
  defaultValue?: any;
  /** Whether the radio group is disabled */
  disabled?: boolean;
  /** Change callback */
  onChange?: (e: any) => void;
  /** Options for radio group */
  options?: Array<{ label: React.ReactNode; value: any; disabled?: boolean }>;
  /** Radio group children */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Layout direction */
  optionType?: 'default' | 'button';
  /** Button style (only works when optionType is button) */
  buttonStyle?: 'outline' | 'solid';
  /** Size of radio buttons */
  size?: 'large' | 'middle' | 'small';
}

/**
 * Custom Radio component
 * Features custom color scheme with ${tokens.color.brand.primary} as the primary color
 * Based on Ant Design Radio with custom styling
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
    <StyledRadio
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      autoFocus={autoFocus}
      className={className}
      style={style}
      value={value}
      {...restProps}
    >
      {children}
    </StyledRadio>
  );
};

/**
 * Radio Group component
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
  buttonStyle = 'outline',
  size = 'middle',
  ...restProps
}) => {
  return (
    <StyledRadioGroup
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={onChange}
      options={options}
      className={className}
      style={style}
      optionType={optionType}
      buttonStyle={buttonStyle}
      size={size}
      {...restProps}
    >
      {children}
    </StyledRadioGroup>
  );
};

Radio.Group = RadioGroup;
Radio.Button = AntRadio.Button;

export default Radio;
