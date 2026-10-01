// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';

/**
 * Filter bar above the list tables: an inline antd <Form> on the left and the
 * "+ Add" action on the right.
 *
 * Previously each feature duplicated a bare `display:flex; justify-content:
 * space-between` div, which wrapped badly on narrow viewports (buttons crammed
 * directly under the input, the Add action pushed hard left). This shared
 * version wraps gracefully: rows get a vertical gap, the form can shrink, and
 * the trailing action stays right-aligned even when it wraps onto its own row.
 */
export const SearchForm = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div
    className={[
      'flex flex-wrap items-start justify-between gap-x-4 gap-y-3',
      '[&_.ant-form]:min-w-0 [&_.ant-form]:flex-auto [&_.ant-form]:gap-y-3',
      // Keep the trailing "+ Add" action right-aligned when it wraps.
      '[&>*+*:last-child]:ml-auto',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </div>
);
