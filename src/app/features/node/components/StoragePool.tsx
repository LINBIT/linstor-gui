import React from 'react';
import { Column } from '@ant-design/plots';
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

  return <Column {...config} />;
};
