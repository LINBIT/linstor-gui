// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import Chart from 'react-apexcharts';
import { forEach, groupBy } from 'lodash';
import { formatBytes } from '@app/utils/size';
import { generateStoragePoolColorPairs, getNodeTotalColorPair } from '@app/utils/storagePoolColors';

type DataItem = {
  type: string;
  value: number;
  storagePool: string;
};

type StoragePoolProp = {
  data: DataItem[];
};

export const StoragePool = ({ data }: StoragePoolProp) => {
  const storagePoolNames = Array.from(new Set(data.map((d) => d.storagePool)));
  const actualStoragePools = storagePoolNames.filter((name) => !name.includes('Total on'));
  const storagePoolCount = actualStoragePools.length;

  let filteredData = data;
  if (storagePoolCount === 1) {
    filteredData = data.filter((item) => !item.storagePool.includes('Total on'));
  }

  const annotations: unknown[] = [];
  forEach(groupBy(filteredData, 'storagePool'), (values, k) => {
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

  // Get unique storage pool names in order
  const orderedPools = Array.from(new Set(filteredData.map((d) => d.storagePool)));

  // Separate actual pools from 'Total on' entries
  const actualPoolsInOrder = orderedPools.filter((name) => !name.includes('Total on'));

  // Generate colors for actual storage pools
  const colorPairs = generateStoragePoolColorPairs(actualPoolsInOrder.length);
  const nodeTotalColorPair = getNodeTotalColorPair();

  // Build series for each storage pool
  const series: any[] = [];
  const colorsArray: string[] = [];

  // Create a series for each storage pool
  orderedPools.forEach((poolName, index) => {
    const poolItem = filteredData.find((d) => d.storagePool === poolName && d.type === 'Used');
    const totalItem = filteredData.find((d) => d.storagePool === poolName && d.type === 'Total');
    const used = poolItem?.value || 0;
    const total = totalItem?.value || 0;
    const free = total - used;

    // Determine which color pair to use
    let colorPair;
    if (poolName.includes('Total on')) {
      // Use node total color for 'Total on' entries
      colorPair = nodeTotalColorPair;
    } else {
      // Use regular storage pool colors
      const poolIndex = actualPoolsInOrder.indexOf(poolName);
      colorPair = colorPairs[poolIndex];
    }

    // Add used data series for this pool
    let usedLabel, freeLabel;
    if (poolName.includes('Total on')) {
      // Extract node name from "Total on nodename"
      const nodeName = poolName.replace('Total on ', '');
      usedLabel = `Total Used on ${nodeName}`;
      freeLabel = `Total Free on ${nodeName}`;
    } else {
      usedLabel = `${poolName} - Used`;
      freeLabel = `${poolName} - Free`;
    }

    series.push({
      name: usedLabel,
      data: orderedPools.map((_, i) => (i === index ? used : 0)),
    });
    colorsArray.push(colorPair.used);

    // Add free data series for this pool
    series.push({
      name: freeLabel,
      data: orderedPools.map((_, i) => (i === index ? free : 0)),
    });
    colorsArray.push(colorPair.free);
  });

  const options = {
    xaxis: {
      categories: Array.from(new Set(filteredData.map((d) => d.storagePool))),
    },
    chart: {
      type: 'bar' as const,
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: storagePoolCount === 1 ? '30%' : '70%',
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
      enabled: false,
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          return formatBytes(val);
        },
      },
    },
    colors: colorsArray,
  };

  return <Chart options={options} series={series} type="bar" height={500} />;
};
