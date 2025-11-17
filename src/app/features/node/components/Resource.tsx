// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import Chart from 'react-apexcharts';

type DataItem = {
  type: string;
  value: number;
};

type ResourceProp = {
  data: DataItem[];
};

export const Resource = ({ data }: ResourceProp) => {
  const options = {
    labels: data.map((d) => d.type),
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
    },
    colors: ['#F79133', '#499BBB'],
    chart: {
      width: '100%',
    },
    plotOptions: {
      pie: {
        size: 180,
        offsetY: 20,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%';
      },
    },
  };

  const series = data.map((d) => d.value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '500px' }}>
      <Chart options={options} series={series} type="pie" height={300} width="100%" />
    </div>
  );
};
