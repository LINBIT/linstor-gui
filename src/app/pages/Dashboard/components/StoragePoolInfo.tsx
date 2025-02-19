import React, { useMemo } from 'react';
import { Card, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { groupBy, union } from 'lodash';
import { getStoragePool } from '@app/features/storagePool';
import { formatBytes } from '@app/utils/size';

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

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

    const validPools = poolsData?.data?.filter((p) => p.provider_kind !== 'DISKLESS');

    const groupedByNode = groupBy(validPools, 'node_name');
    const allNodes = Object.keys(groupedByNode);

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
      const usedForPool: number[] = [];
      allNodes.forEach((node) => {
        const found = groupedByNode[node].find((i) => i.storage_pool_name === pool);
        const total = found?.total_capacity ?? 0;
        const used = total - (found?.free_capacity ?? 0);
        totalsForPool.push(total);
        usedForPool.push(used);
      });
      spSeries.push({
        name: `${pool} Total`,
        group: pool,
        data: totalsForPool,
      });
      spSeries.push({
        name: `${pool} Used`,
        group: pool,
        data: usedForPool,
      });
    });

    const nodeTotalSeries = {
      name: 'Node Total',
      group: 'NodeAll',
      data: allNodes.map((n) => nodeTotals[n]),
    };
    const nodeUsedSeries = {
      name: 'Node Used',
      group: 'NodeAll',
      data: allNodes.map((n) => nodeUsed[n]),
    };

    return {
      series: [...spSeries, nodeTotalSeries, nodeUsedSeries],
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
      type: 'bar' as const,
      stacked: true,
      height: 450,
    },
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    xaxis: {
      categories: chartData.categories,
    },
    legend: {
      position: 'bottom' as const,
    },
    dataLabels: {
      formatter: (val: number) => formatBytes(val),
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

  return (
    <Card title={t('common:storage_pool_overview')} bordered={false}>
      <Chart options={options} series={chartData.series} type="bar" height={350} />
    </Card>
  );
};
