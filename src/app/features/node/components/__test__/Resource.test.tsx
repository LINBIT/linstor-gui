// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Resource } from '../Resource';

// Mock react-apexcharts
const mockChartRender = vi.fn();

interface MockChartProps {
  options: {
    labels: string[];
    legend: { position: string };
    colors: string[];
  };
  series: number[];
  type: string;
  height: number;
}

vi.mock('react-apexcharts', () => ({
  default: (props: MockChartProps) => {
    mockChartRender(props);
    return (
      <div data-testid="mock-chart" data-chart-type={props.type} data-height={props.height}>
        Mock Chart Component
        <div data-testid="chart-labels">{JSON.stringify(props.options.labels)}</div>
        <div data-testid="chart-series">{JSON.stringify(props.series)}</div>
        <div data-testid="chart-colors">{JSON.stringify(props.options.colors)}</div>
        <div data-testid="chart-legend-position">{props.options.legend.position}</div>
      </div>
    );
  },
}));

describe('Resource Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = [
    { type: 'Active', value: 10 },
    { type: 'Inactive', value: 5 },
  ];

  describe('Basic Rendering', () => {
    it('should render the Chart component', () => {
      render(<Resource data={mockData} />);

      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
      expect(screen.getByText('Mock Chart Component')).toBeInTheDocument();
    });

    it('should render chart with correct type', () => {
      render(<Resource data={mockData} />);

      const chartElement = screen.getByTestId('mock-chart');
      expect(chartElement).toHaveAttribute('data-chart-type', 'pie');
    });

    it('should render chart with correct height', () => {
      render(<Resource data={mockData} />);

      const chartElement = screen.getByTestId('mock-chart');
      expect(chartElement).toHaveAttribute('data-height', '300');
    });
  });

  describe('Data Processing', () => {
    it('should process data correctly for labels', () => {
      render(<Resource data={mockData} />);

      const labelsElement = screen.getByTestId('chart-labels');
      expect(labelsElement).toHaveTextContent('["Active","Inactive"]');
    });

    it('should process data correctly for series', () => {
      render(<Resource data={mockData} />);

      const seriesElement = screen.getByTestId('chart-series');
      expect(seriesElement).toHaveTextContent('[10,5]');
    });

    it('should handle empty data array', () => {
      render(<Resource data={[]} />);

      const labelsElement = screen.getByTestId('chart-labels');
      const seriesElement = screen.getByTestId('chart-series');

      expect(labelsElement).toHaveTextContent('[]');
      expect(seriesElement).toHaveTextContent('[]');
    });

    it('should handle single data item', () => {
      const singleData = [{ type: 'Single', value: 100 }];
      render(<Resource data={singleData} />);

      const labelsElement = screen.getByTestId('chart-labels');
      const seriesElement = screen.getByTestId('chart-series');

      expect(labelsElement).toHaveTextContent('["Single"]');
      expect(seriesElement).toHaveTextContent('[100]');
    });

    it('should handle multiple data items', () => {
      const multipleData = [
        { type: 'Type A', value: 25 },
        { type: 'Type B', value: 35 },
        { type: 'Type C', value: 15 },
        { type: 'Type D', value: 25 },
      ];
      render(<Resource data={multipleData} />);

      const labelsElement = screen.getByTestId('chart-labels');
      const seriesElement = screen.getByTestId('chart-series');

      expect(labelsElement).toHaveTextContent('["Type A","Type B","Type C","Type D"]');
      expect(seriesElement).toHaveTextContent('[25,35,15,25]');
    });
  });

  describe('Chart Configuration', () => {
    it('should set correct legend position', () => {
      render(<Resource data={mockData} />);

      const legendElement = screen.getByTestId('chart-legend-position');
      expect(legendElement).toHaveTextContent('bottom');
    });

    it('should set correct colors', () => {
      render(<Resource data={mockData} />);

      const colorsElement = screen.getByTestId('chart-colors');
      expect(colorsElement).toHaveTextContent('["#F79133","#499BBB"]');
    });

    it('should pass correct options to Chart component', () => {
      render(<Resource data={mockData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            labels: ['Active', 'Inactive'],
            legend: {
              position: 'bottom',
              horizontalAlign: 'center',
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
              formatter: expect.any(Function),
            },
          }),
          series: [10, 5],
          type: 'pie',
          height: 300,
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle data with zero values', () => {
      const zeroData = [
        { type: 'Zero', value: 0 },
        { type: 'Non-Zero', value: 10 },
      ];
      render(<Resource data={zeroData} />);

      const seriesElement = screen.getByTestId('chart-series');
      expect(seriesElement).toHaveTextContent('[0,10]');
    });

    it('should handle data with negative values', () => {
      const negativeData = [
        { type: 'Negative', value: -5 },
        { type: 'Positive', value: 15 },
      ];
      render(<Resource data={negativeData} />);

      const seriesElement = screen.getByTestId('chart-series');
      expect(seriesElement).toHaveTextContent('[-5,15]');
    });

    it('should handle data with decimal values', () => {
      const decimalData = [
        { type: 'Decimal', value: 12.5 },
        { type: 'Integer', value: 7 },
      ];
      render(<Resource data={decimalData} />);

      const seriesElement = screen.getByTestId('chart-series');
      expect(seriesElement).toHaveTextContent('[12.5,7]');
    });

    it('should handle data with special characters in type names', () => {
      const specialData = [
        { type: 'Type/A', value: 10 },
        { type: 'Type-B', value: 20 },
        { type: 'Type_C', value: 30 },
      ];
      render(<Resource data={specialData} />);

      const labelsElement = screen.getByTestId('chart-labels');
      expect(labelsElement).toHaveTextContent('["Type/A","Type-B","Type_C"]');
    });

    it('should handle data with empty string type names', () => {
      const emptyTypeData = [
        { type: '', value: 10 },
        { type: 'Valid', value: 20 },
      ];
      render(<Resource data={emptyTypeData} />);

      const labelsElement = screen.getByTestId('chart-labels');
      expect(labelsElement).toHaveTextContent('["","Valid"]');
    });
  });

  describe('Component Props', () => {
    it('should accept and process data prop correctly', () => {
      const testData = [
        { type: 'Test1', value: 100 },
        { type: 'Test2', value: 200 },
      ];

      render(<Resource data={testData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            labels: ['Test1', 'Test2'],
          }),
          series: [100, 200],
        }),
      );
    });

    it('should handle data prop updates', () => {
      const initialData = [{ type: 'Initial', value: 10 }];
      const updatedData = [{ type: 'Updated', value: 20 }];

      const { rerender } = render(<Resource data={initialData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            labels: ['Initial'],
          }),
          series: [10],
        }),
      );

      rerender(<Resource data={updatedData} />);

      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            labels: ['Updated'],
          }),
          series: [20],
        }),
      );
    });
  });

  describe('Chart Integration', () => {
    it('should call Chart component with all required props', () => {
      render(<Resource data={mockData} />);

      expect(mockChartRender).toHaveBeenCalledTimes(1);
      expect(mockChartRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.any(Object),
          series: expect.any(Array),
          type: 'pie',
          height: 300,
        }),
      );
    });

    it('should maintain chart configuration consistency', () => {
      render(<Resource data={mockData} />);

      const chartCall = mockChartRender.mock.calls[0][0];

      // Verify options structure
      expect(chartCall.options).toHaveProperty('labels');
      expect(chartCall.options).toHaveProperty('legend');
      expect(chartCall.options).toHaveProperty('colors');

      // Verify legend configuration
      expect(chartCall.options.legend).toHaveProperty('position', 'bottom');

      // Verify colors configuration
      expect(chartCall.options.colors).toEqual(['#F79133', '#499BBB']);
    });
  });

  describe('Type Safety', () => {
    it('should handle DataItem type correctly', () => {
      const typedData: Array<{ type: string; value: number }> = [{ type: 'Typed', value: 42 }];

      render(<Resource data={typedData} />);

      const labelsElement = screen.getByTestId('chart-labels');
      const seriesElement = screen.getByTestId('chart-series');

      expect(labelsElement).toHaveTextContent('["Typed"]');
      expect(seriesElement).toHaveTextContent('[42]');
    });
  });
});
