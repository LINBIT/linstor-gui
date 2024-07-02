import React from 'react';
import Chart from 'react-apexcharts';
import { forEach, groupBy } from 'lodash-es';

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
  const config = {
    data,
    xField: 'storagePool',
    yField: 'value',
    stack: true,
    colorField: 'type',
    label: {
      text: 'value',
      textBaseline: 'bottom',
      position: 'inside',
    },
    annotations,
  };

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
      height: 350,
    },
    legend: {
      position: 'right' as const,
      offsetY: 40,
    },
    fill: {
      opacity: 1,
    },
    dataLabels: {
      formatter: (val) => {
        return val + 'GiB';
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => {
          return val + 'GiB';
        },
      },
    },
    colors: ['#499BBB', '#C4DBE6'],
  };

  // return <div>hi</div>;

  return <Chart options={options} series={series} type="bar" height={350} />;
};
