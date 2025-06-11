// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useQuery } from '@tanstack/react-query';
import { getResources } from '../api';
import { getFaultyResources } from '@app/utils/resource';

export const useFaultyResources = () => {
  return useQuery({
    queryKey: ['getFaultyResources'],
    queryFn: async () => {
      const all = await getResources();
      const faulty = getFaultyResources(all?.data ?? ([] as any));
      return faulty;
    },
  });
};
