// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { getAllResources } from '../api';
import { ResourceListQuery } from '../types';

const useResources = (query?: ResourceListQuery) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ['getAllResources', query],
    queryFn: () => getAllResources(query),
  });

  return {
    isLoading,
    error,
    data: data?.data,
  };
};

export { useResources };
