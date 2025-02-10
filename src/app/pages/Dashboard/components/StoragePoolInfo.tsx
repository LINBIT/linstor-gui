import React, { useMemo } from 'react';
import { Card, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Chart from 'react-apexcharts';
import { groupBy } from 'lodash';
import { getStoragePool } from '@app/features/storagePool';

export const StoragePoolInfo: React.FC = () => {
  const { t } = useTranslation();

  const { data: poolsData, isLoading } = useQuery({
    queryKey: ['getStoragePool'],
    queryFn: () => getStoragePool(),
  });

  const chartData = useMemo(() => {
    if (!poolsData) return null;

    const filteredPools = poolsData?.data?.filter((pool) => pool.provider_kind !== 'DISKLESS');

    const groupedByNode = groupBy(filteredPools, 'node_name');

    const series = [
      {
        name: t('common:free_capacity'),
        data: [] as number[],
      },
      {
        name: t('common:used_capacity'),
        data: [] as number[],
      },
    ];

    const categories = [] as string[];

    Object.entries(groupedByNode).forEach(([nodeName, pools]) => {
      const totalCapacity = pools.reduce((sum, pool) => sum + pool.total_capacity, 0);
      const freeCapacity = pools.reduce((sum, pool) => sum + pool.free_capacity, 0);
      const usedCapacity = totalCapacity - freeCapacity;

      series[0].data.push(Number((freeCapacity / 1024 / 1024).toFixed(2)));
      series[1].data.push(Number((usedCapacity / 1024 / 1024).toFixed(2)));
      categories.push(nodeName);
    });

    return {
      options: {
        chart: {
          type: 'bar' as const,
          stacked: true,
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
          },
        },
        xaxis: {
          categories,
          title: {
            text: t('common:nodes'),
          },
        },
        yaxis: {
          title: {
            text: t('common:capacity') + ' (GiB)',
          },
          labels: {
            formatter: (val: number) => val.toFixed(2),
          },
        },
        colors: ['#52c41a', '#ff4d4f'],
        legend: {
          position: 'top' as const,
        },
        dataLabels: {
          enabled: true,
          formatter: (val: number) => val.toFixed(2),
        },
        tooltip: {
          y: {
            formatter: (val: number) => val.toFixed(2) + ' GiB',
          },
        },
      },
      series,
    };
  }, [poolsData, t]);

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  return (
    <Card title={t('common:storage_pool_overview')} bordered={false}>
      {chartData && <Chart options={chartData.options} series={chartData.series} type="bar" height={350} />}
    </Card>
  );
};
