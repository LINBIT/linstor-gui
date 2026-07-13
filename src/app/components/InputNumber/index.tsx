// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { InputNumber as AntInputNumber, InputNumberProps as AntInputNumberProps } from 'antd';
import styled from '@emotion/styled';
import { tokens } from '@app/const/color';

const BRAND = tokens.color.brand.primary;
const FOCUS_SHADOW = `0 0 0 2px ${tokens.focusRing}`;

const StyledInputNumber = styled(AntInputNumber)`
  &.ant-input-number:hover,
  &.ant-input-number-affix-wrapper:hover {
    border-color: ${BRAND} !important;
  }

  &.ant-input-number-focused,
  &.ant-input-number-affix-wrapper-focused,
  &.ant-input-number:focus-within {
    border-color: ${BRAND} !important;
    box-shadow: ${FOCUS_SHADOW} !important;
  }

  .ant-input-number-handler:hover .ant-input-number-handler-up-inner,
  .ant-input-number-handler:hover .ant-input-number-handler-down-inner {
    color: ${BRAND} !important;
  }
`;

export type InputNumberProps = AntInputNumberProps;

/**
 * Custom InputNumber component.
 * Drop-in replacement for antd's InputNumber with the brand color scheme
 * (brand primary) applied to hover/focus states and the stepper handles.
 */
export const InputNumber = StyledInputNumber as typeof AntInputNumber;

export default InputNumber;
