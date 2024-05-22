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
  // const config = {
  //   data,
  //   angleField: 'value',
  //   colorField: 'type',
  //   label: {
  //     text: 'value',
  //     style: {
  //       fontWeight: 'bold',
  //     },
  //   },
  //   legend: {
  //     color: {
  //       title: false,
  //       position: 'right',
  //       rowPadding: 5,
  //     },
  //   },
  // };
  const options = {
    labels: data.map((d) => d.type),
    legend: {
      position: 'bottom' as const,
    },
    colors: ['#f79133', '#80c7fd'],
    width: 400,
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const series = data.map((d) => d.value);

  return <Chart options={options} series={series} type="pie" height={350} />;
};
