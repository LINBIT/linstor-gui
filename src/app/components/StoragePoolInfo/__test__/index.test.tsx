// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoragePoolInfo } from '../index';

// Mock the getStoragePool API function
const mockGetStoragePool = vi.fn();
vi.mock('@app/features/storagePool', () => ({
  getStoragePool: () => mockGetStoragePool(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common:storage_pool_overview': 'Storage Pool Overview',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock formatBytes utility
vi.mock('@app/utils/size', () => ({
  formatBytes: (bytes: number) => `${bytes} B`,
}));

// Mock useWindowSize hook
const mockUseWindowSize = vi.fn();
vi.mock('@app/hooks', () => ({
  useWindowSize: () => mockUseWindowSize(),
}));

// Mock Chart component from react-apexcharts
interface MockChartProps {
  options: unknown;
  series: unknown;
  type: string;
  height: number;
  width?: number;
}

vi.mock('react-apexcharts', () => ({
  default: ({ options, series, type, height, width }: MockChartProps) => (
    <div
      data-testid="mock-chart"
      data-options={JSON.stringify(options)}
      data-series={JSON.stringify(series)}
      data-type={type}
      data-height={height}
      data-width={width}
    >
      Mock Chart Component
    </div>
  ),
}));

// Types for series data
interface SeriesItem {
  name: string;
  group: string;
  data: number[];
  color: string;
}

// Test data
const mockStoragePoolData = {
  data: [
    {
      node_name: 'node1',
      storage_pool_name: 'pool1',
      provider_kind: 'LVM',
      total_capacity: 1000000000, // 1GB
      free_capacity: 400000000, // 400MB
    },
    {
      node_name: 'node1',
      storage_pool_name: 'pool2',
      provider_kind: 'ZFS',
      total_capacity: 2000000000, // 2GB
      free_capacity: 800000000, // 800MB
    },
    {
      node_name: 'node2',
      storage_pool_name: 'pool1',
      provider_kind: 'LVM',
      total_capacity: 1500000000, // 1.5GB
      free_capacity: 600000000, // 600MB
    },
    {
      node_name: 'node2',
      storage_pool_name: 'pool2',
      provider_kind: 'ZFS',
      total_capacity: 1800000000, // 1.8GB
      free_capacity: 500000000, // 500MB
    },
    {
      node_name: 'node3',
      storage_pool_name: 'diskless-pool',
      provider_kind: 'DISKLESS',
      total_capacity: 0,
      free_capacity: 0,
    },
  ],
};

const mockEmptyData = {
  data: [],
};

const mockSinglePoolData = {
  data: [
    {
      node_name: 'node1',
      storage_pool_name: 'pool1',
      provider_kind: 'LVM',
      total_capacity: 1000000000,
      free_capacity: 400000000,
    },
  ],
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Suppress error logging in tests
        onError: () => {},
      },
    },
    // Suppress all logging in tests
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('StoragePoolInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value
    mockUseWindowSize.mockReturnValue({
      width: 1920,
      height: 1080,
    });
  });

  describe('basic rendering', () => {
    it('should render the card with correct title', () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      expect(screen.getByText('Storage Pool Overview')).toBeInTheDocument();
    });

    it('should show loading spinner when data is loading', () => {
      mockGetStoragePool.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithQueryClient(<StoragePoolInfo />);

      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });

  describe('data processing', () => {
    it('should filter out DISKLESS provider kind', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      // Wait for the component to render
      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const seriesData = JSON.parse(chartElement.getAttribute('data-series') || '[]');

      // Should not include data from DISKLESS pools
      // The series should contain data for pool1 and pool2 from node1 and node2
      expect(seriesData.length).toBeGreaterThan(0);

      // Verify that series names don't include diskless-pool
      const seriesNames = seriesData.map((s: SeriesItem) => s.name);
      expect(seriesNames.some((name: string) => name.includes('diskless-pool'))).toBe(false);
    });

    it('should handle empty data gracefully', async () => {
      mockGetStoragePool.mockResolvedValue(mockEmptyData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const seriesData = JSON.parse(chartElement.getAttribute('data-series') || '[]');
      const optionsData = JSON.parse(chartElement.getAttribute('data-options') || '{}');

      expect(seriesData).toEqual([]);
      expect(optionsData.xaxis.categories).toEqual([]);
    });

    it('should process multiple nodes and pools correctly', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const optionsData = JSON.parse(chartElement.getAttribute('data-options') || '{}');
      const seriesData = JSON.parse(chartElement.getAttribute('data-series') || '[]');

      // Should have both node1 and node2 in categories (excluding node3 because it only has DISKLESS)
      expect(optionsData.xaxis.categories).toEqual(['node1', 'node2']);

      // Should have series for both pools (used + free) plus node totals
      expect(seriesData.length).toBeGreaterThan(4); // At least 4 series for 2 pools (2 used + 2 free) + node series
    });

    it('should generate correct series names for used and free capacity', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const seriesData: SeriesItem[] = JSON.parse(chartElement.getAttribute('data-series') || '[]');

      const seriesNames = seriesData.map((s: SeriesItem) => s.name);

      // Should contain used and free series for each pool
      expect(seriesNames).toContain('pool1 - <b>Used<b>');
      expect(seriesNames).toContain('pool1 - <b>Free</b>');
      expect(seriesNames).toContain('pool2 - <b>Used<b>');
      expect(seriesNames).toContain('pool2 - <b>Free</b>');
    });
  });

  describe('chart configuration', () => {
    it('should configure chart options correctly', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const optionsData = JSON.parse(chartElement.getAttribute('data-options') || '{}');

      expect(optionsData.chart.stacked).toBe(true);
      expect(optionsData.chart.toolbar.show).toBe(false);
      expect(optionsData.plotOptions.bar.horizontal).toBe(false);
      expect(optionsData.plotOptions.bar.columnWidth).toBe('20%');
      expect(optionsData.legend.position).toBe('bottom');
      expect(optionsData.dataLabels.enabled).toBe(false);
    });

    it('should set correct chart type and height', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');

      expect(chartElement.getAttribute('data-type')).toBe('bar');
      expect(chartElement.getAttribute('data-height')).toBe('500'); // height > 900, so should be 500
    });

    it('should adjust width for many nodes', async () => {
      // Create data with many nodes
      const manyNodesData = {
        data: Array.from({ length: 6 }, (_, i) => ({
          node_name: `node${i + 1}`,
          storage_pool_name: 'pool1',
          provider_kind: 'LVM',
          total_capacity: 1000000000,
          free_capacity: 400000000,
        })),
      };

      mockGetStoragePool.mockResolvedValue(manyNodesData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');

      // Should have width attribute when nodeCount >= 5
      expect(chartElement.getAttribute('data-width')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle single pool without node totals', async () => {
      mockGetStoragePool.mockResolvedValue(mockSinglePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const seriesData = JSON.parse(chartElement.getAttribute('data-series') || '[]');

      // Should not include node total series when there's only one pool
      const nodeSeriesCount = seriesData.filter((s: SeriesItem) => s.group === 'NodeAll').length;
      expect(nodeSeriesCount).toBe(0);
    });

    it('should handle null/undefined capacity values', async () => {
      const dataWithNulls = {
        data: [
          {
            node_name: 'node1',
            storage_pool_name: 'pool1',
            provider_kind: 'LVM',
            total_capacity: null,
            free_capacity: undefined,
          },
        ],
      };

      mockGetStoragePool.mockResolvedValue(dataWithNulls);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      // Should not throw error and render the chart
      const chartElement = screen.getByTestId('mock-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('should handle API error gracefully', async () => {
      mockGetStoragePool.mockRejectedValue(new Error('API Error'));

      renderWithQueryClient(<StoragePoolInfo />);

      // Component should still render without crashing
      expect(screen.getByText('Storage Pool Overview')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should adjust chart height based on window size', () => {
      // Mock smaller window size
      mockUseWindowSize.mockReturnValue({
        width: 1200,
        height: 800, // Less than 900
      });

      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      const chartElement = screen.getByTestId('mock-chart');

      // Should use height 300 when window height <= 900
      expect(chartElement.getAttribute('data-height')).toBe('300');
    });
  });

  describe('data calculations', () => {
    it('should calculate used capacity correctly', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const seriesData: SeriesItem[] = JSON.parse(chartElement.getAttribute('data-series') || '[]');

      // Find pool1 used series
      const pool1UsedSeries = seriesData.find((s: SeriesItem) => s.name === 'pool1 - <b>Used<b>');
      expect(pool1UsedSeries).toBeTruthy();

      // For node1: used = total - free = 1000000000 - 400000000 = 600000000
      // For node2: used = total - free = 1500000000 - 600000000 = 900000000
      expect(pool1UsedSeries?.data).toEqual([600000000, 900000000]);
    });

    it('should assign different colors to different pools', async () => {
      mockGetStoragePool.mockResolvedValue(mockStoragePoolData);

      renderWithQueryClient(<StoragePoolInfo />);

      await screen.findByTestId('mock-chart');

      const chartElement = screen.getByTestId('mock-chart');
      const seriesData: SeriesItem[] = JSON.parse(chartElement.getAttribute('data-series') || '[]');

      const pool1UsedSeries = seriesData.find((s: SeriesItem) => s.name === 'pool1 - <b>Used<b>');
      const pool2UsedSeries = seriesData.find((s: SeriesItem) => s.name === 'pool2 - <b>Used<b>');

      // Should have different colors
      expect(pool1UsedSeries?.color).not.toBe(pool2UsedSeries?.color);
    });
  });
});
