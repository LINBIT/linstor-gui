// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Pagination } from '@patternfly/react-core';

interface ListPaginationProp {
  total: number;
  currentPage: number;
  pageSize: number;
  onSetPage: (page: number) => void;
  onSetPerPage: (perPage: number) => void;
}

export const ListPagination: React.FC<ListPaginationProp> = ({
  onSetPage,
  onSetPerPage,
  total,
  pageSize = 10,
  currentPage = 1,
}: ListPaginationProp) => {
  return (
    <Pagination
      itemCount={total}
      perPage={pageSize}
      page={currentPage}
      onSetPage={(e, newPage) => {
        onSetPage(newPage);
      }}
      onPerPageSelect={(e, newPerPage, newPage) => {
        onSetPage(newPage);
        onSetPerPage(newPerPage);
      }}
    />
  );
};
