// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

import { SearchForm as BaseSearchForm } from '@app/components/SearchForm';
import { tokens } from '@app/const/color';

export const SearchForm = styled(BaseSearchForm)`
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
    background-color: ${tokens.color.brand.primary} !important;
    border-color: ${tokens.color.brand.primary} !important;
    color: ${tokens.color.brand.onPrimary} !important;
    font-weight: 600 !important;

    &:hover {
      background-color: ${tokens.color.brand.primaryHover} !important;
      border-color: ${tokens.color.brand.primaryHover} !important;
    }
  }

  .secondary-button {
    border: 1.5px solid ${tokens.color.brand.primary} !important;
    color: ${tokens.color.brand.onPrimary} !important;
    font-weight: 600 !important;

    &:hover {
      background-color: ${tokens.color.brand.primaryHover} !important;
      border-color: ${tokens.color.brand.primaryHover} !important;
    }
  }
`;
