import React from 'react';
import Chart from 'react-apexcharts';

import './PieChart.css';

interface PieChartProps {
  data?: Array<{ x: string; y: string | number }>;
  legendData?: Array<{ name: string }>;
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, legendData, title }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const series = data?.map((e) => Number(e.y)) || [];

  const options = {
    labels: data?.map((e) => e.x),
    colors: ['#f79133', '#1e2939', '#80c7fd', '#008FFB', '#80f1cb', '#00E396'],
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
