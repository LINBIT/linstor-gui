// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { getNodes } from '../api';
import { NodeListQuery } from '../types';

const useNodes = (query?: NodeListQuery) => {
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ['getNodes', query],
    queryFn: () => getNodes(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
    refetch,
  };
};

export { useNodes };
