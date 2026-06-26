// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';
import styled from '@emotion/styled';

const BRAND = '#ffcc9c';
const FOCUS_SHADOW = '0 0 0 2px rgba(255, 204, 156, 0.2)';

const StyledSelect = styled(AntSelect)`
  &.ant-select:not(.ant-select-disabled):hover .ant-select-selector {
    border-color: ${BRAND} !important;
  }

  &.ant-select-focused:not(.ant-select-disabled):not(.ant-select-customize-input) .ant-select-selector {
    border-color: ${BRAND} !important;
    box-shadow: ${FOCUS_SHADOW} !important;
  }
` as unknown as typeof AntSelect;

export type SelectProps<T = unknown> = AntSelectProps<T>;

/**
 * Custom Select component.
 * Drop-in replacement for antd's Select with the brand color scheme (#FFCC9C)
 * applied to the selector hover/focus border. The selected-option background
 * inside the dropdown is handled by the global `colorPrimary` theme token.
 * Exposes the same sub-components (Option, OptGroup).
 */
export const Select = StyledSelect;
Select.Option = AntSelect.Option;
Select.OptGroup = AntSelect.OptGroup;

export default Select;
