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
    },
    colors: ['#499BBB', '#8FF9FF'],
  };

  const series = data.map((d) => d.value);

  return <Chart options={options} series={series} type="pie" height={500} />;
};
