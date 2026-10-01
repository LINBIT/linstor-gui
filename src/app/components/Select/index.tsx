// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';

export type SelectProps<T = unknown> = AntSelectProps<T>;

/**
 * antd's Select under the project name. The brand look (peach hover/focus
 * border and focus ring, the peach selected option) comes from the Select
 * tokens in the antd theme, so it covers antd's own selects as well.
 */
export const Select = AntSelect;

export default Select;
