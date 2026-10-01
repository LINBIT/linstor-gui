// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { InputNumber as AntInputNumber, InputNumberProps as AntInputNumberProps } from 'antd';

export type InputNumberProps = AntInputNumberProps;

/**
 * antd's InputNumber under the project name. The brand hover/focus border,
 * focus ring and stepper hover color come from the InputNumber tokens in the
 * antd theme.
 */
export const InputNumber = AntInputNumber;

export default InputNumber;
