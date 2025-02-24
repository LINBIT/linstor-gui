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

const ChartContainer = styled.div`
  overflow-x: auto;
`;

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

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

    const nodeTotals: Record<string, number> = {};
    const nodeUsed: Record<string, number> = {};
    allNodes.forEach((node) => {
      const nodeSp = groupedByNode[node];
      nodeTotals[node] = nodeSp.reduce((acc, item) => acc + (item.total_capacity || 0), 0);
      nodeUsed[node] = nodeSp.reduce((acc, item) => acc + ((item.total_capacity || 0) - (item.free_capacity || 0)), 0);
    });

    const spSeries: any[] = [];
    allPools.forEach((pool) => {
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
        color: '#499BBB', // Lighter color for used (light green)
      });

      // Used data should come first (on top), followed by free data
      spSeries.push({
        name: `${pool} Free`, // Show Free below
        group: pool,
        data: freeForPool,
        color: '#C4DBE6',
      });
    });

    const nodeTotalSeries = {
      name: 'Node Free', // Change the name to indicate free space
      group: 'NodeAll',
      data: allNodes.map((n) => nodeTotals[n] - nodeUsed[n]), // Free = Total - Used
      color: '#C4DBE6', // Darker color for free (green)
    };

    const nodeUsedSeries = {
      name: 'Node Used', // Used data should be on top
      group: 'NodeAll',
      data: allNodes.map((n) => nodeUsed[n]),
      color: '#499BBB', // Lighter color for used (light green)
    };

    return {
      series: [...spSeries, nodeUsedSeries, nodeTotalSeries],
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
  const chartWidth = nodeCount * 350; // adjust as needed

  const width =
    nodeCount >= 5
      ? {
          width: chartWidth,
        }
      : {};

  return (
    <Card title={t('common:storage_pool_overview')}>
      <ChartContainer>
        <Chart options={options} series={chartData.series} type="bar" height={400} {...width} />
      </ChartContainer>
    </Card>
  );
};
