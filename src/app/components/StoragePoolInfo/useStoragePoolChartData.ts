// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoragePool } from '@app/features/storagePool';
import type { ThemeMode } from '@app/const/themeTokens';
import { buildChartData, seriesTotalsOf } from './chartData';

/** The storage pools, as chart series per node, and each series' total. */
export const useStoragePoolChartData = (mode: ThemeMode) => {
  // Fetching the storage pool data from the API
  const { data: poolsData, isPending } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const chartData = useMemo(() => buildChartData(poolsData, mode), [poolsData, mode]);

  const seriesTotals = useMemo(() => seriesTotalsOf(chartData.series), [chartData.series]);

  return { chartData, seriesTotals, isPending };
};
