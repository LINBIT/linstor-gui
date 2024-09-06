// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import Chart from 'react-apexcharts';

import './PieChart.css';

interface PieChartProps {
  data?: Array<{ x: string; y: string | number }>;
  legendData?: Array<{ name: string }>;
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const series = data?.map((e) => Number(e.y)) || [];

  const options = {
    labels: data?.map((e) => e.x),
    colors: ['#499BBB', '#8FF9FF', '#1E2939', '#D2D4D7', '#787F88', '#AAAAAA'],
    legend: {
      position: 'bottom' as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom' as const,
          },
        },
      },
    ],
  };

  return (
    <div className="piechart__wrap">
      <div className="piechart__title">{title}</div>
      <div>
        <Chart type="pie" options={options} series={series} />
      </div>
    </div>
  );
};

export default PieChart;
