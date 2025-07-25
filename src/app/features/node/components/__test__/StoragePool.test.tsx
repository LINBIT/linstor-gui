// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoragePool } from '../StoragePool';

// Mock react-apexcharts
const mockChartRender = vi.fn();

interface MockChartProps {
  options: {
    xaxis: { categories: string[] };
    chart: { type: string; stacked: boolean; toolbar: { show: boolean } };
    plotOptions: { bar: { columnWidth: string } };
    responsive: Array<{ breakpoint: number; options: object }>;
    legend: { position: string; offsetY: number };
    fill: { opacity: number };
    dataLabels: { formatter: (val: number) => string };
    yaxis: { labels: { formatter: (val: number) => string } };
    colors: string[];
  };
  series: Array<{ name: string; data: number[] }>;
  type: string;
  height: number;
}

vi.mock('react-apexcharts', () => ({
  default: (props: MockChartProps) => {
    mockChartRender(props);
    return (
      <div data-testid="mock-chart" data-chart-type={props.type} data-height={props.height}>
        Mock Chart Component
        <div data-testid="chart-categories">{JSON.stringify(props.options.xaxis.categories)}</div>
        <div data-testid="chart-series">{JSON.stringify(props.series)}</div>
        <div data-testid="chart-colors">{JSON.stringify(props.options.colors)}</div>
        <div data-testid="chart-stacked">{props.options.chart.stacked.toString()}</div>
        <div data-testid="chart-column-width">{props.options.plotOptions.bar.columnWidth}</div>
      </div>
    );
  },
}));

// Mock formatBytes utility
vi.mock('@app/utils/size', () => ({
  formatBytes: vi.fn((val: number) => `${val}B`),
}));

describe('StoragePool Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = [
    { type: 'Total', value: 1000, storagePool: 'pool1' },
    { type: 'Used', value: 300, storagePool: 'pool1' },
    { type: 'Total', value: 2000, storagePool: 'pool2' },
    { type: 'Used', value: 800, storagePool: 'pool2' },
  ];

  describe('Basic Rendering', () => {
    it('should render the Chart component', () => {
      render(<StoragePool data={mockData} />);

      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
      expect(screen.getByText('Mock Chart Component')).toBeInTheDocument();
    });

    it('should render chart with correct type', () => {
      render(<StoragePool data={mockData} />);

      const chartElement = screen.getByTestId('mock-chart');
      expect(chartElement).toHaveAttribute('data-chart-type', 'bar');
    });

    it('should render chart with correct height', () => {
      render(<StoragePool data={mockData} />);

      const chartElement = screen.getByTestId('mock-chart');
      expect(chartElement).toHaveAttribute('data-height', '500');
    });

    it('should render as stacked bar chart', () => {
      render(<StoragePool data={mockData} />);

      const stackedElement = screen.getByTestId('chart-stacked');
      expect(stackedElement).toHaveTextContent('true');
    });
  });

  describe('Data Processing - Multiple Storage Pools', () => {
    it('should process categories correctly with multiple pools', () => {
      render(<StoragePool data={mockData} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      expect(categoriesElement).toHaveTextContent('["pool1","pool2"]');
    });

    it('should process series data correctly', () => {
      render(<StoragePool data={mockData} />);

      const seriesElement = screen.getByTestId('chart-series');
      const expectedSeries = [
        { name: 'total', data: [1000, 2000] },
        { name: 'used', data: [300, 800] },
      ];
      expect(seriesElement).toHaveTextContent(JSON.stringify(expectedSeries));
    });

    it('should set column width to 70% for multiple pools', () => {
      render(<StoragePool data={mockData} />);

      const columnWidthElement = screen.getByTestId('chart-column-width');
      expect(columnWidthElement).toHaveTextContent('70%');
    });
  });

  describe('Data Processing - Single Storage Pool', () => {
    const singlePoolData = [
      { type: 'Total', value: 1000, storagePool: 'pool1' },
      { type: 'Used', value: 300, storagePool: 'pool1' },
    ];

    it('should process single pool data correctly', () => {
      render(<StoragePool data={singlePoolData} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      expect(categoriesElement).toHaveTextContent('["pool1"]');

      const seriesElement = screen.getByTestId('chart-series');
      const expectedSeries = [
        { name: 'total', data: [1000] },
        { name: 'used', data: [300] },
      ];
      expect(seriesElement).toHaveTextContent(JSON.stringify(expectedSeries));
    });

    it('should set column width to 30% for single pool', () => {
      render(<StoragePool data={singlePoolData} />);

      const columnWidthElement = screen.getByTestId('chart-column-width');
      expect(columnWidthElement).toHaveTextContent('30%');
    });
  });

  describe('Data Processing - Total on Filtering', () => {
    const dataWithTotalOn = [
      { type: 'Total', value: 1000, storagePool: 'pool1' },
      { type: 'Used', value: 300, storagePool: 'pool1' },
      { type: 'Total', value: 3000, storagePool: 'Total on pool1' },
      { type: 'Used', value: 1000, storagePool: 'Total on pool1' },
    ];

    it('should filter out "Total on" pools when there is only one actual pool', () => {
      render(<StoragePool data={dataWithTotalOn} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      expect(categoriesElement).toHaveTextContent('["pool1"]');

      const seriesElement = screen.getByTestId('chart-series');
      const expectedSeries = [
        { name: 'total', data: [1000] },
        { name: 'used', data: [300] },
      ];
      expect(seriesElement).toHaveTextContent(JSON.stringify(expectedSeries));
    });

    it('should include "Total on" pools when there are multiple actual pools', () => {
      const multiPoolWithTotalOn = [
        ...mockData,
        { type: 'Total', value: 3000, storagePool: 'Total on all' },
        { type: 'Used', value: 1100, storagePool: 'Total on all' },
      ];

      render(<StoragePool data={multiPoolWithTotalOn} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      expect(categoriesElement).toHaveTextContent('["pool1","pool2","Total on all"]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data array', () => {
      render(<StoragePool data={[]} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      const seriesElement = screen.getByTestId('chart-series');

      expect(categoriesElement).toHaveTextContent('[]');
      expect(seriesElement).toHaveTextContent('[{"name":"total","data":[]},{"name":"used","data":[]}]');
    });

    it('should handle data with only Total type', () => {
      const totalOnlyData = [
        { type: 'Total', value: 1000, storagePool: 'pool1' },
        { type: 'Total', value: 2000, storagePool: 'pool2' },
      ];

      render(<StoragePool data={totalOnlyData} />);

      const seriesElement = screen.getByTestId('chart-series');
      const expectedSeries = [
        { name: 'total', data: [1000, 2000] },
        { name: 'used', data: [] },
      ];
      expect(seriesElement).toHaveTextContent(JSON.stringify(expectedSeries));
    });

    it('should handle data with only Used type', () => {
      const usedOnlyData = [
        { type: 'Used', value: 300, storagePool: 'pool1' },
        { type: 'Used', value: 800, storagePool: 'pool2' },
      ];

      render(<StoragePool data={usedOnlyData} />);

      const seriesElement = screen.getByTestId('chart-series');
      const expectedSeries = [
        { name: 'total', data: [] },
        { name: 'used', data: [300, 800] },
      ];
      expect(seriesElement).toHaveTextContent(JSON.stringify(expectedSeries));
    });

    it('should handle data with zero values', () => {
      const zeroData = [
        { type: 'Total', value: 0, storagePool: 'pool1' },
        { type: 'Used', value: 0, storagePool: 'pool1' },
      ];

      render(<StoragePool data={zeroData} />);

      const seriesElement = screen.getByTestId('chart-series');
      const expectedSeries = [
        { name: 'total', data: [0] },
        { name: 'used', data: [0] },
      ];
      expect(seriesElement).toHaveTextContent(JSON.stringify(expectedSeries));
    });

    it('should handle data with special characters in storage pool names', () => {
      const specialData = [
        { type: 'Total', value: 1000, storagePool: 'pool-1_test' },
        { type: 'Used', value: 300, storagePool: 'pool-1_test' },
        { type: 'Total', value: 2000, storagePool: 'pool/2@test' },
        { type: 'Used', value: 800, storagePool: 'pool/2@test' },
      ];

      render(<StoragePool data={specialData} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      expect(categoriesElement).toHaveTextContent('["pool-1_test","pool/2@test"]');
    });
  });

  describe('Chart Configuration', () => {
    it('should set correct colors', () => {
      render(<StoragePool data={mockData} />);

      const colorsElement = screen.getByTestId('chart-colors');
      expect(colorsElement).toHaveTextContent('["#499BBB","#C4DBE6"]');
    });

    it('should pass correct chart options to Chart component', () => {
      render(<StoragePool data={mockData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            xaxis: {
              categories: ['pool1', 'pool2'],
            },
            chart: {
              type: 'bar',
              stacked: true,
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                columnWidth: '70%',
              },
            },
            legend: {
              position: 'right',
              offsetY: 40,
            },
            fill: {
              opacity: 1,
            },
            colors: ['#499BBB', '#C4DBE6'],
          }),
          series: [
            { name: 'total', data: [1000, 2000] },
            { name: 'used', data: [300, 800] },
          ],
          type: 'bar',
          height: 500,
        }),
      );
    });

    it('should configure responsive options correctly', () => {
      render(<StoragePool data={mockData} />);

      const chartCall = mockChartRender.mock.calls[0][0];
      expect(chartCall.options.responsive).toEqual([
        {
          breakpoint: 768,
          options: {
            legend: {
              position: 'bottom',
            },
            chart: {
              height: 400,
            },
          },
        },
      ]);
    });

    it('should configure formatters correctly', () => {
      render(<StoragePool data={mockData} />);

      const chartCall = mockChartRender.mock.calls[0][0];
      expect(chartCall.options.dataLabels.formatter).toBeInstanceOf(Function);
      expect(chartCall.options.yaxis.labels.formatter).toBeInstanceOf(Function);
    });
  });

  describe('Storage Pool Count Logic', () => {
    it('should correctly count actual storage pools', () => {
      const dataWithMixedPools = [
        { type: 'Total', value: 1000, storagePool: 'pool1' },
        { type: 'Used', value: 300, storagePool: 'pool1' },
        { type: 'Total', value: 2000, storagePool: 'pool2' },
        { type: 'Used', value: 800, storagePool: 'pool2' },
        { type: 'Total', value: 3000, storagePool: 'Total on all' },
        { type: 'Used', value: 1100, storagePool: 'Total on all' },
      ];

      render(<StoragePool data={dataWithMixedPools} />);

      // Should use 70% column width because there are 2 actual pools (excluding "Total on")
      const columnWidthElement = screen.getByTestId('chart-column-width');
      expect(columnWidthElement).toHaveTextContent('70%');
    });

    it('should handle duplicate storage pool names', () => {
      const duplicateData = [
        { type: 'Total', value: 1000, storagePool: 'pool1' },
        { type: 'Used', value: 300, storagePool: 'pool1' },
        { type: 'Total', value: 2000, storagePool: 'pool1' },
        { type: 'Used', value: 800, storagePool: 'pool1' },
      ];

      render(<StoragePool data={duplicateData} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      expect(categoriesElement).toHaveTextContent('["pool1"]');

      const columnWidthElement = screen.getByTestId('chart-column-width');
      expect(columnWidthElement).toHaveTextContent('30%');
    });
  });

  describe('Type Safety', () => {
    it('should handle DataItem type correctly', () => {
      type DataItem = {
        type: string;
        value: number;
        storagePool: string;
      };

      const typedData: DataItem[] = [
        { type: 'Total', value: 1000, storagePool: 'pool1' },
        { type: 'Used', value: 300, storagePool: 'pool1' },
      ];

      render(<StoragePool data={typedData} />);

      const categoriesElement = screen.getByTestId('chart-categories');
      const seriesElement = screen.getByTestId('chart-series');

      expect(categoriesElement).toHaveTextContent('["pool1"]');
      expect(seriesElement).toHaveTextContent('[{"name":"total","data":[1000]},{"name":"used","data":[300]}]');
    });
  });

  describe('Chart Integration', () => {
    it('should call Chart component with all required props', () => {
      render(<StoragePool data={mockData} />);

      expect(mockChartRender).toHaveBeenCalledTimes(1);
      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.any(Object),
          series: expect.any(Array),
          type: 'bar',
          height: 500,
        }),
      );
    });

    it('should maintain chart configuration consistency', () => {
      render(<StoragePool data={mockData} />);

      const chartCall = mockChartRender.mock.calls[0][0];

      // Verify options structure
      expect(chartCall.options).toHaveProperty('xaxis');
      expect(chartCall.options).toHaveProperty('chart');
      expect(chartCall.options).toHaveProperty('plotOptions');
      expect(chartCall.options).toHaveProperty('responsive');
      expect(chartCall.options).toHaveProperty('legend');
      expect(chartCall.options).toHaveProperty('fill');
      expect(chartCall.options).toHaveProperty('dataLabels');
      expect(chartCall.options).toHaveProperty('yaxis');
      expect(chartCall.options).toHaveProperty('colors');

      // Verify series structure
      expect(chartCall.series).toHaveLength(2);
      expect(chartCall.series[0]).toHaveProperty('name', 'total');
      expect(chartCall.series[1]).toHaveProperty('name', 'used');
    });
  });

  describe('Component Props', () => {
    it('should accept and process data prop correctly', () => {
      const testData = [
        { type: 'Total', value: 5000, storagePool: 'test-pool' },
        { type: 'Used', value: 2000, storagePool: 'test-pool' },
      ];

      render(<StoragePool data={testData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            xaxis: {
              categories: ['test-pool'],
            },
          }),
          series: [
            { name: 'total', data: [5000] },
            { name: 'used', data: [2000] },
          ],
        }),
      );
    });

    it('should handle data prop updates', () => {
      const initialData = [
        { type: 'Total', value: 1000, storagePool: 'initial-pool' },
        { type: 'Used', value: 300, storagePool: 'initial-pool' },
      ];
      const updatedData = [
        { type: 'Total', value: 2000, storagePool: 'updated-pool' },
        { type: 'Used', value: 800, storagePool: 'updated-pool' },
      ];

      const { rerender } = render(<StoragePool data={initialData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            xaxis: {
              categories: ['initial-pool'],
            },
          }),
          series: [
            { name: 'total', data: [1000] },
            { name: 'used', data: [300] },
          ],
        }),
      );

      rerender(<StoragePool data={updatedData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            xaxis: {
              categories: ['updated-pool'],
            },
          }),
          series: [
            { name: 'total', data: [2000] },
            { name: 'used', data: [800] },
          ],
        }),
      );
    });
  });
});
