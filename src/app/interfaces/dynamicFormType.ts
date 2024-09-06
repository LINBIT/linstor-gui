// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export type FormItemType =
  | 'text'
  | 'single_select'
  | 'multiple_select'
  | 'integer'
  | 'text_area'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'auxiliary'
  | 'size'
  | 'iqn';

export const TYPE_MAP = {
  TEXT: 'text' as FormItemType,
  SINGLE_SELECT: 'single_select' as FormItemType,
  MULTIPLE_SELECT: 'multiple_select' as FormItemType,
  INTEGER: 'integer' as FormItemType,
  TEXTAREA: 'text_area' as FormItemType,
  CHECKBOX: 'checkbox' as FormItemType,
  RADIO: 'radio' as FormItemType,
  SLIDER: 'slider' as FormItemType,
  AUXILIARY: 'auxiliary' as FormItemType,
  SIZE: 'size' as FormItemType,
  IQN: 'iqn' as FormItemType,
  SWITCH_INPUT: 'switch_input' as FormItemType,
};

export type FormItem = {
  id: string;
  name: string;
  type: FormItemType;
  label: string;
  tipLabel?: string;
  hide?: boolean;
  validationInfo?: {
    isRequired?: boolean;
    invalidMessage?: string;
    minLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  isDisabled?: boolean;
  defaultValue?: string | { [key: string]: string } | number | boolean | Array<string> | undefined;
  needWatch?: boolean;
  watchCallback?: (data: string) => void;
  extraInfo?: {
    options: Array<{
      label: string;
      value: string;
      isDisabled: boolean;
    }>;
    isCreatable?: boolean;
  };
};
