// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { getResources } from '../api';
import { getFaultyResources } from '@app/utils/resource';
import { REFETCH_INTERVAL } from '@app/const/time';

export const useFaultyResources = () => {
  return useQuery({
    queryKey: ['getFaultyResources'],
    queryFn: async () => {
      const all = await getResources();
      const faulty = getFaultyResources(all?.data ?? ([] as any));
      return faulty;
    },
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_INTERVAL,
  });
};
