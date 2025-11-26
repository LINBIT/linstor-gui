// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo } from 'react';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { groupBy, union } from 'lodash';
import { getStoragePool } from '@app/features/storagePool';
import { formatBytes } from '@app/utils/size';
import styled from '@emotion/styled';
import { useWindowSize } from '@app/hooks';
import { generateStoragePoolColorPairs, getNodeTotalColorPair } from '@app/utils/storagePoolColors';

type SeriesItem = {
  name: string;
  group: string;
  data: number[];
  color: string;
};

const ChartContainer = styled.div<{ enableScroll?: boolean }>`
  overflow-x: ${(props) => (props.enableScroll ? 'auto' : 'visible')};
`;

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

  const { height } = useWindowSize();

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

    const colorPairs = generateStoragePoolColorPairs(allPools.length);
    const nodeColorPair = getNodeTotalColorPair();

    const nodeTotals: Record<string, number> = {};
    const nodeUsed: Record<string, number> = {};
    allNodes.forEach((node) => {
      const nodeSp = groupedByNode[node];
      nodeTotals[node] = nodeSp.reduce((acc, item) => acc + (item.total_capacity || 0), 0);
      nodeUsed[node] = nodeSp.reduce((acc, item) => acc + ((item.total_capacity || 0) - (item.free_capacity || 0)), 0);
    });

    const spSeries: SeriesItem[] = [];
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
        name: `${pool} - <b>Used<b>`, // Show Used above
        group: pool,
        data: totalsForPool.map((total, idx) => total - freeForPool[idx]), // Used = Total - Free
        color: colors.used,
      });

      // Used data should come first (on top), followed by free data
      spSeries.push({
        name: `${pool} - <b>Free</b>`, // Show Free below
        group: pool,
        data: freeForPool,
        color: colors.free,
      });
    });

    const nodeTotalSeries = {
      name: 'Node - <b>Free</b>', // Change the name to indicate free space
      group: 'NodeAll',
      data: allNodes.map((n) => nodeTotals[n] - nodeUsed[n]), // Free = Total - Used
      color: nodeColorPair.free,
    };

    const nodeUsedSeries = {
      name: 'Node - <b>Used</b>', // Used data should be on top
      group: 'NodeAll',
      data: allNodes.map((n) => nodeUsed[n]),
      color: nodeColorPair.used,
    };

    return {
      series: allPools.length > 1 ? [...spSeries, nodeUsedSeries, nodeTotalSeries] : [...spSeries],
      categories: allNodes,
    };
  }, [poolsData]);

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
  const chartWidth = nodeCount * 400;

  const widthForChart =
    nodeCount >= 5
      ? {
          width: chartWidth,
        }
      : {};

  return (
    <div className="border-2 border-gray-200 rounded px-[34px] py-[30px]">
      <h3 className="m-0 mb-4 text-[26px] font-semibold">{t('common:storage_pool_overview')}</h3>
      <Spin spinning={isLoading}>
        <ChartContainer enableScroll={nodeCount >= 5}>
          <Chart
            options={options}
            series={chartData.series}
            type="bar"
            height={height > 900 ? 500 : 300}
            {...widthForChart}
          />
        </ChartContainer>
      </Spin>
    </div>
  );
};
