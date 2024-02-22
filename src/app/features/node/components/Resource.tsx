import React from 'react';
import { Pie } from '@ant-design/plots';

type DataItem = {
  type: string;
  value: number;
};

type ResourceProp = {
  data: DataItem[];
};

export const Resource = ({ data }: ResourceProp) => {
  const config = {
    data,
    angleField: 'value',
    colorField: 'type',
    label: {
      text: (d) => `${d.type}\n ${d.value}`,
      position: 'spider',
    },
  };

  return <Pie {...config} />;
};
