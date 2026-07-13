// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

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
export const SearchForm = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px 16px;

  .ant-form {
    flex: 1 1 auto;
    min-width: 0;
    row-gap: 12px;
  }

  /* Keep the trailing "+ Add" action right-aligned when it wraps. */
  & > *:not(:first-child):last-child {
    margin-left: auto;
  }
`;
