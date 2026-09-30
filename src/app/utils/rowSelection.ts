// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { CheckboxProps } from 'antd';
import i18n from 'i18next';

/**
 * A Table's rowSelection.getCheckboxProps that names each row's checkbox after
 * its row ("Select node-a"); antd leaves them unlabelled, so a screen reader
 * announces a column of anonymous checkboxes. CheckboxProps does not declare
 * aria-label, but the Checkbox hands it on to its <input>.
 */
export const labelRowCheckbox =
  <T>(nameOf: (row: T) => string | undefined) =>
  (row: T): CheckboxProps =>
    ({ 'aria-label': i18n.t('common:select_row', { name: nameOf(row) ?? '' }) }) as CheckboxProps;
