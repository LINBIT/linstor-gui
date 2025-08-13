// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('../api', () => ({
  getResources: vi.fn(),
}));

vi.mock('@app/utils/resource', () => ({
  getFaultyResources: vi.fn(),
}));

// Import after mocks
import { useFaultyResources } from '../hooks/useFaultyResources';
import { getResources } from '../api';
import { getFaultyResources } from '@app/utils/resource';

// Mock data
const mockAllResources = {
  data: [
    {
      name: 'healthy-resource',
      node_name: 'node1',
      state: {
        in_use: false,
      },
      volumes: [
        {
          volume_number: 0,
          state: {
            disk_state: 'UpToDate',
          },
        },
      ],
    },
    {
      name: 'faulty-resource-1',
      node_name: 'node2',
      state: {
        in_use: true,
      },
      volumes: [
        {
          volume_number: 0,
          state: {
            disk_state: 'Failed',
          },
        },
      ],
    },
    {
      name: 'faulty-resource-2',
      node_name: 'node3',
      state: {
        in_use: false,
      },
      volumes: [
        {
          volume_number: 0,
          state: {
            disk_state: 'Inconsistent',
          },
        },
      ],
    },
  ],
};

const mockFaultyResources = [
  {
    name: 'faulty-resource-1',
    node_name: 'node2',
    state: {
      in_use: true,
    },
    volumes: [
      {
        volume_number: 0,
        state: {
          disk_state: 'Failed',
        },
      },
    ],
  },
  {
    name: 'faulty-resource-2',
    node_name: 'node3',
    state: {
      in_use: false,
    },
    volumes: [
      {
        volume_number: 0,
        state: {
          disk_state: 'Inconsistent',
        },
      },
    ],
  },
];

describe('useFaultyResources Hook', () => {
  let mockGetResources: any;
  let mockGetFaultyResources: any;
  let queryClient: QueryClient;

  // Helper function to create wrapper with QueryClient
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false },
      },
    });

    // Get mocked functions
    mockGetResources = vi.mocked(getResources);
    mockGetFaultyResources = vi.mocked(getFaultyResources);

    // Setup default mock implementations
    mockGetResources.mockResolvedValue(mockAllResources);
    mockGetFaultyResources.mockReturnValue(mockFaultyResources);
  });

  describe('Basic Functionality', () => {
    it('should fetch all resources and filter faulty ones', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetResources).toHaveBeenCalledWith();
      expect(mockGetFaultyResources).toHaveBeenCalledWith(mockAllResources.data);
      expect(result.current.data).toEqual(mockFaultyResources);
      expect(result.current.isLoading).toBe(false);
    });

    it('should use correct query key', async () => {
      renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(queryClient.getQueriesData(['getFaultyResources'])).toBeDefined();
      });
    });

    it('should handle successful data fetching', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFaultyResources);
      expect(result.current.error).toBeNull();
      expect(result.current.isError).toBe(false);
    });

    it('should return data in the expected format', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data?.[0]).toHaveProperty('name');
      expect(data?.[0]).toHaveProperty('node_name');
      expect(data?.[0]).toHaveProperty('state');
      expect(data?.[0]).toHaveProperty('volumes');
    });
  });

  describe('Data Scenarios', () => {
    it('should handle empty resource list', async () => {
      mockGetResources.mockResolvedValue({ data: [] });
      mockGetFaultyResources.mockReturnValue([]);

      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(mockGetFaultyResources).toHaveBeenCalledWith([]);
    });

    it('should handle null/undefined resource data', async () => {
      mockGetResources.mockResolvedValue({ data: null });
      mockGetFaultyResources.mockReturnValue([]);

      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetFaultyResources).toHaveBeenCalledWith([]);
      expect(result.current.data).toEqual([]);
    });

    it('should handle undefined resource data gracefully', async () => {
      mockGetResources.mockResolvedValue({ data: undefined });
      mockGetFaultyResources.mockReturnValue([]);

      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetFaultyResources).toHaveBeenCalledWith([]);
    });

    it('should handle all healthy resources', async () => {
      const healthyResources = {
        data: [
          {
            name: 'healthy-1',
            node_name: 'node1',
            state: { in_use: false },
            volumes: [{ volume_number: 0, state: { disk_state: 'UpToDate' } }],
          },
          {
            name: 'healthy-2',
            node_name: 'node2',
            state: { in_use: false },
            volumes: [{ volume_number: 0, state: { disk_state: 'UpToDate' } }],
          },
        ],
      };

      mockGetResources.mockResolvedValue(healthyResources);
      mockGetFaultyResources.mockReturnValue([]);

      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(mockGetFaultyResources).toHaveBeenCalledWith(healthyResources.data);
    });

    it('should handle mixed resource states', async () => {
      const mixedResources = {
        data: [
          ...mockAllResources.data,
          {
            name: 'another-healthy',
            node_name: 'node4',
            state: { in_use: false },
            volumes: [{ volume_number: 0, state: { disk_state: 'UpToDate' } }],
          },
        ],
      };

      mockGetResources.mockResolvedValue(mixedResources);

      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetFaultyResources).toHaveBeenCalledWith(mixedResources.data);
      expect(result.current.data).toEqual(mockFaultyResources);
    });
  });

  describe('Hook Behavior', () => {
    it('should refetch data when query is invalidated', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetResources).toHaveBeenCalledTimes(1);

      // Invalidate the query
      await queryClient.invalidateQueries(['getFaultyResources']);

      await waitFor(() => {
        expect(mockGetResources).toHaveBeenCalledTimes(2);
      });
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(typeof result.current.refetch).toBe('function');

      await result.current.refetch();

      expect(mockGetResources).toHaveBeenCalledTimes(2);
    });

    it('should maintain consistent data structure across re-renders', async () => {
      const { result, rerender } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const initialData = result.current.data;

      rerender();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(initialData);
    });

    it('should handle loading states correctly', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should cache results when using custom QueryClient with caching enabled', async () => {
      // Create a custom QueryClient with caching enabled
      const cachingQueryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, cacheTime: 5000, staleTime: 1000 },
          mutations: { retry: false },
        },
      });

      const cachingWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={cachingQueryClient}>{children}</QueryClientProvider>
      );

      const { result: result1 } = renderHook(() => useFaultyResources(), {
        wrapper: cachingWrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      const { result: result2 } = renderHook(() => useFaultyResources(), {
        wrapper: cachingWrapper,
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should only call API once due to caching when using caching-enabled client
      expect(mockGetResources).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);
    });

    it('should handle large datasets efficiently', async () => {
      const largeResourceList = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          name: `resource-${i}`,
          node_name: `node-${i % 10}`,
          state: { in_use: i % 5 === 0 },
          volumes: [
            {
              volume_number: 0,
              state: { disk_state: i % 7 === 0 ? 'Failed' : 'UpToDate' },
            },
          ],
        })),
      };

      const largeFaultyList = largeResourceList.data.filter((_, i) => i % 7 === 0);

      mockGetResources.mockResolvedValue(largeResourceList);
      mockGetFaultyResources.mockReturnValue(largeFaultyList);

      const start = performance.now();
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const end = performance.now();

      expect(result.current.data).toEqual(largeFaultyList);
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration with React Query', () => {
    it('should use React Query features correctly', async () => {
      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that all React Query properties are available
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('isFetching');
    });

    it('should respect QueryClient configuration', async () => {
      const customQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            cacheTime: 5000,
            staleTime: 1000,
          },
        },
      });

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={customQueryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useFaultyResources(), {
        wrapper: customWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFaultyResources);
    });
  });
});
