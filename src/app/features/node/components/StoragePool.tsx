// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import Chart from 'react-apexcharts';
import { forEach, groupBy } from 'lodash';
import { formatBytes } from '@app/utils/size';

type DataItem = {
  type: string;
  value: number;
  storagePool: string;
};

type StoragePoolProp = {
  data: DataItem[];
};

export const StoragePool = ({ data }: StoragePoolProp) => {
  const annotations = [] as any;
  forEach(groupBy(data, 'storagePool'), (values, k) => {
    const value = values.reduce((a, b) => a + b.value, 0);

    annotations.push({
      type: 'text',
      data: [k, value],
      xField: 'storagePool',
      yField: 'value',
      style: {
        text: `${value}(GiB)`,
        textBaseline: 'bottom',
        position: 'top',
        textAlign: 'center',
        fontSize: 14,
        fill: 'rgba(0,0,0,0.85)',
      },
      tooltip: false,
    });
  });

  const series = [
    {
      name: 'total',
      data: data?.filter((e) => e.type === 'Total')?.map((d) => d.value),
    },
    {
      name: 'used',
      data: data?.filter((e) => e.type === 'Used')?.map((d) => d.value),
    },
  ];

  const options = {
    xaxis: {
      categories: Array.from(new Set(data.map((d) => d.storagePool))),
    },
    chart: {
      type: 'bar' as const,
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: 'bottom' as const,
          },
          chart: {
            height: 400,
          },
        },
      },
    ],
    legend: {
      position: 'right' as const,
      offsetY: 40,
    },
    fill: {
      opacity: 1,
    },
    dataLabels: {
      formatter: (val: number) => {
        return formatBytes(val);
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          return formatBytes(val);
        },
      },
    },
    colors: ['#499BBB', '#C4DBE6'],
  };

  return <Chart options={options} series={series} type="bar" height={500} />;
};
