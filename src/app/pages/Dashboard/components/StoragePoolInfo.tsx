// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo } from 'react';
import { Card, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { groupBy, union } from 'lodash';
import { getStoragePool } from '@app/features/storagePool';
import { formatBytes } from '@app/utils/size';
import styled from '@emotion/styled';
import { useWindowSize } from '@app/hooks';

const ChartContainer = styled.div`
  overflow-x: auto;
`;

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

  const { width, height } = useWindowSize();

  console.log(`Window size: ${width} x ${height}`);

  // Fetching the storage pool data from the API
  const { data: poolsData, isLoading } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const chartData = useMemo(() => {
    if (!poolsData || poolsData?.data?.length === 0) {
      return {
        series: [],
        categories: [],
      };
    }

    // Filter out the DISKLESS provider kind
    const validPools = poolsData?.data?.filter((p) => p.provider_kind !== 'DISKLESS');

    // Group pools by node name for processing
    const groupedByNode = groupBy(validPools, 'node_name');
    const allNodes = Object.keys(groupedByNode);

    // Union of all unique storage pool names across all nodes
    const allPools = union(...allNodes.map((node) => groupedByNode[node].map((sp) => sp.storage_pool_name)));

    const generateColorPairs = (count: number) => {
      const basePairs = [
        { used: '#01579B', free: '#B3E5FC' },
        { used: '#B71C1C', free: '#FFCDD2' },
        { used: '#1B5E20', free: '#C8E6C9' },
        { used: '#4A148C', free: '#E1BEE7' },
        { used: '#E65100', free: '#FFE0B2' },
        { used: '#880E4F', free: '#F8BBD0' },
        { used: '#5D4037', free: '#D7CCC8' },
        { used: '#827717', free: '#F0F4C3' },
        { used: '#311B92', free: '#D1C4E9' },
        { used: '#BF360C', free: '#FFCCBC' },
        { used: '#33691E', free: '#DCEDC8' },
      ];

      const result = [];
      for (let i = 0; i < count; i++) {
        result.push(basePairs[i % basePairs.length]);
      }
      return result;
    };

    const colorPairs = generateColorPairs(allPools.length);

    const nodeTotals: Record<string, number> = {};
    const nodeUsed: Record<string, number> = {};
    allNodes.forEach((node) => {
      const nodeSp = groupedByNode[node];
      nodeTotals[node] = nodeSp.reduce((acc, item) => acc + (item.total_capacity || 0), 0);
      nodeUsed[node] = nodeSp.reduce((acc, item) => acc + ((item.total_capacity || 0) - (item.free_capacity || 0)), 0);
    });

    const spSeries: any[] = [];
    allPools.forEach((pool, idx) => {
      const colorIndex = idx % colorPairs.length;
      const colors = colorPairs[colorIndex];

      const totalsForPool: number[] = [];
      const freeForPool: number[] = [];
      allNodes.forEach((node) => {
        const found = groupedByNode[node].find((i) => i.storage_pool_name === pool);
        const total = found?.total_capacity ?? 0;
        const free = found?.free_capacity ?? 0;
        totalsForPool.push(total);
        freeForPool.push(free);
      });

      spSeries.push({
        name: `${pool} Used`, // Show Used above
        group: pool,
        data: totalsForPool.map((total, idx) => total - freeForPool[idx]), // Used = Total - Free
        color: colors.used,
      });

      // Used data should come first (on top), followed by free data
      spSeries.push({
        name: `${pool} Free`, // Show Free below
        group: pool,
        data: freeForPool,
        color: colors.free,
      });
    });

    const nodeTotalSeries = {
      name: 'Node Free', // Change the name to indicate free space
      group: 'NodeAll',
      data: allNodes.map((n) => nodeTotals[n] - nodeUsed[n]), // Free = Total - Used
      color: '#D5E6C4', // Darker color for free (green)
    };

    const nodeUsedSeries = {
      name: 'Node Used', // Used data should be on top
      group: 'NodeAll',
      data: allNodes.map((n) => nodeUsed[n]),
      color: '#82BB49', // Lighter color for used (light green)
    };

    return {
      series: allPools.length > 1 ? [...spSeries, nodeUsedSeries, nodeTotalSeries] : [...spSeries],
      categories: allNodes,
    };
  }, [poolsData]);

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  const options = {
    chart: {
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '20%',
      },
    },
    xaxis: {
      categories: chartData.categories,
    },
    legend: {
      position: 'bottom' as const,
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatBytes(val),
      },
    },
    fill: {
      opacity: 1,
    },
    stroke: {
      width: 1,
      colors: ['#fff'],
    },
  };

  const nodeCount = chartData.categories.length;
  const chartWidth = nodeCount * 400; // adjust as needed

  const widthForChart =
    nodeCount >= 5
      ? {
          width: chartWidth,
        }
      : {};

  return (
    <Card title={t('common:storage_pool_overview')}>
      <ChartContainer>
        <Chart
          options={options}
          series={chartData.series}
          type="bar"
          height={height > 900 ? 500 : 300}
          {...widthForChart}
        />
      </ChartContainer>
    </Card>
  );
};
