// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

export const SearchForm = styled.div`
  display: flex;
  justify-content: space-between;

  .ant-form-item {
    margin-right: 24px;

    .ant-form-item-label {
      margin-right: 8px;
    }
  }

  .ant-form-item:has(.ant-switch) {
    margin-right: 32px;
  }

  .primary-button {
    background-color: #ffcc9c !important;
    border-color: #ffcc9c !important;
    color: #111111 !important;
    font-weight: 600 !important;

    &:hover {
      background-color: #ffdcbc !important;
      border-color: #ffdcbc !important;
    }
  }

  .secondary-button {
    border: 1.5px solid #ffcc9c !important;
    color: #111111 !important;
    font-weight: 600 !important;

    &:hover {
      background-color: #ffdcbc !important;
      border-color: #ffdcbc !important;
    }
  }
`;
