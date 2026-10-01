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
  /* antd 6: one root (.ant-input-number), with or without a prefix */
  &.ant-input-number:hover {
    border-color: ${BRAND} !important;
  }

  &.ant-input-number-focused,
  &.ant-input-number:focus-within {
    border-color: ${BRAND} !important;
    box-shadow: ${FOCUS_SHADOW} !important;
  }

  .ant-input-number-action:hover {
    color: ${BRAND} !important;
  }
`;

export type InputNumberProps = AntInputNumberProps;

/**
 * Custom InputNumber component.
 * Drop-in replacement for antd's InputNumber with the brand color scheme
 * (brand primary) applied to hover/focus states and the stepper handles.
 */
export const InputNumber = StyledInputNumber as unknown as typeof AntInputNumber;

export default InputNumber;
