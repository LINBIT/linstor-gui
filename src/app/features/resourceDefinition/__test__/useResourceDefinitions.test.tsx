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
  getResourceDefinition: vi.fn(),
}));

// Import after mocks
import { useResourceDefinitions } from '../hooks/useResourceDefinitions';
import { getResourceDefinition } from '../api';

// Mock data
const mockResourceDefinitionData = {
  data: [
    {
      name: 'database-resource-def',
      resource_group_name: 'production',
      props: {
        'Aux/description': 'Production database resource definition',
        'Aux/team': 'database-team',
        'Aux/environment': 'prod',
      },
      volume_definitions: [
        {
          volume_number: 0,
          size_kib: 10485760, // 10GB
          props: {
            'StorDriver/StorPoolName': 'ssd-pool',
          },
        },
      ],
    },
    {
      name: 'web-app-resource-def',
      resource_group_name: 'staging',
      props: {
        'Aux/description': 'Web application resource definition',
        'Aux/team': 'web-team',
        'Aux/environment': 'staging',
      },
      volume_definitions: [
        {
          volume_number: 0,
          size_kib: 5242880, // 5GB
        },
        {
          volume_number: 1,
          size_kib: 2097152, // 2GB
        },
      ],
    },
    {
      name: 'cache-resource-def',
      resource_group_name: 'production',
      props: {
        'Aux/description': 'Redis cache resource definition',
        'Aux/type': 'cache',
        'Aux/technology': 'redis',
      },
      volume_definitions: [
        {
          volume_number: 0,
          size_kib: 1048576, // 1GB
          props: {
            'StorDriver/StorPoolName': 'nvme-pool',
          },
        },
      ],
    },
  ],
};

const mockEmptyData = {
  data: [],
};

const mockSingleResourceData = {
  data: [
    {
      name: 'single-resource-def',
      resource_group_name: 'test',
      props: {
        'Aux/description': 'Single test resource definition',
      },
      volume_definitions: [],
    },
  ],
};

describe('useResourceDefinitions Hook', () => {
  let mockGetResourceDefinition: any;
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

    // Get mocked function
    mockGetResourceDefinition = vi.mocked(getResourceDefinition);

    // Setup default mock implementation
    mockGetResourceDefinition.mockResolvedValue(mockResourceDefinitionData);
  });

  describe('Basic Functionality', () => {
    it('should fetch resource definitions without query parameters', async () => {
      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockResourceDefinitionData.data);
      expect(result.current.error).toBeNull();
    });

    it('should fetch resource definitions with query parameters', async () => {
      const query = {
        resource_definitions: ['database-resource-def', 'web-app-resource-def'],
        props: ['Aux/description', 'Aux/team'],
        with_volume_definitions: true,
      };

      const { result } = renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query);
      expect(result.current.data).toEqual(mockResourceDefinitionData.data);
    });

    it('should use correct query key with parameters', async () => {
      const query = {
        resource_definitions: ['test-resource-def'],
      };

      renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(queryClient.getQueriesData(['getResources', query])).toBeDefined();
      });
    });

    it('should use correct query key without parameters', async () => {
      renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(queryClient.getQueriesData(['getResources', undefined])).toBeDefined();
      });
    });

    it('should return data in the expected format', async () => {
      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const data = result.current.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(data?.[0]).toHaveProperty('name');
      expect(data?.[0]).toHaveProperty('resource_group_name');
      expect(data?.[0]).toHaveProperty('props');
      expect(data?.[0]).toHaveProperty('volume_definitions');
    });
  });

  describe('Data Scenarios', () => {
    it('should handle empty resource definition list', async () => {
      mockGetResourceDefinition.mockResolvedValue(mockEmptyData);

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle single resource definition', async () => {
      mockGetResourceDefinition.mockResolvedValue(mockSingleResourceData);

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].name).toBe('single-resource-def');
    });

    it('should handle null/undefined resource definition data', async () => {
      mockGetResourceDefinition.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle undefined response data', async () => {
      mockGetResourceDefinition.mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('should handle resource definitions with different structures', async () => {
      const variedData = {
        data: [
          {
            name: 'minimal-resource-def',
            resource_group_name: 'minimal',
            props: {},
            volume_definitions: [],
          },
          {
            name: 'complex-resource-def',
            resource_group_name: 'complex',
            props: {
              'Aux/description': 'Complex resource definition',
              'Aux/team': 'complex-team',
              'Aux/environment': 'production',
              'DrbdOptions/auto-promote': 'yes',
              'DrbdOptions/quorum': 'majority',
            },
            volume_definitions: [
              {
                volume_number: 0,
                size_kib: 20971520, // 20GB
                props: {
                  'StorDriver/StorPoolName': 'fast-pool',
                  'DrbdOptions/encrypt-password': 'encryption-key',
                },
              },
              {
                volume_number: 1,
                size_kib: 10485760, // 10GB
                props: {
                  'StorDriver/StorPoolName': 'slow-pool',
                },
              },
            ],
          },
        ],
      };

      mockGetResourceDefinition.mockResolvedValue(variedData);

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].props).toEqual({});
      expect(result.current.data?.[1].props).toHaveProperty('DrbdOptions/auto-promote');
    });
  });

  describe('Query Parameters', () => {
    it('should handle resource definition name filtering', async () => {
      const query = {
        resource_definitions: ['database-resource-def'],
      };

      const filteredData = {
        data: [mockResourceDefinitionData.data[0]],
      };

      mockGetResourceDefinition.mockResolvedValue(filteredData);

      const { result } = renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].name).toBe('database-resource-def');
    });

    it('should handle property filtering', async () => {
      const query = {
        props: ['Aux/description'],
      };

      const { result } = renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query);
    });

    it('should handle volume definition inclusion', async () => {
      const query = {
        with_volume_definitions: true,
      };

      const { result } = renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query);
      expect(result.current.data?.[0]).toHaveProperty('volume_definitions');
    });

    it('should handle complex query combinations', async () => {
      const query = {
        resource_definitions: ['database-resource-def', 'web-app-resource-def'],
        props: ['Aux/description', 'Aux/team', 'Aux/environment'],
        with_volume_definitions: true,
      };

      const { result } = renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query);
    });

    it('should handle empty query object', async () => {
      const query = {};

      const { result } = renderHook(() => useResourceDefinitions(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query);
    });
  });

  describe('Loading States', () => {
    it('should handle loading state correctly', async () => {
      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResourceDefinitionData.data);
    });

    it('should handle immediate data availability from cache', async () => {
      // First call to populate cache
      const { result: firstResult } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(firstResult.current.isLoading).toBe(false);
      });

      // Second call should use cached data
      const { result: secondResult } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      // Should have immediate access to cached data
      expect(secondResult.current.data).toEqual(mockResourceDefinitionData.data);
    });
  });

  describe('Hook Behavior', () => {
    it('should refetch data when query parameters change', async () => {
      const initialQuery = {
        resource_definitions: ['database-resource-def'],
      };

      const { result, rerender } = renderHook((props) => useResourceDefinitions(props.query), {
        wrapper: createWrapper(),
        initialProps: { query: initialQuery },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(initialQuery);

      // Change query parameters
      const newQuery = {
        resource_definitions: ['web-app-resource-def'],
      };

      rerender({ query: newQuery });

      await waitFor(() => {
        expect(mockGetResourceDefinition).toHaveBeenCalledWith(newQuery);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledTimes(2);
    });

    it('should not refetch when query parameters remain the same', async () => {
      const query = {
        resource_definitions: ['database-resource-def'],
      };

      const { result, rerender } = renderHook((props) => useResourceDefinitions(props.query), {
        wrapper: createWrapper(),
        initialProps: { query },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledTimes(1);

      // Rerender with same query
      rerender({ query });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not call API again
      expect(mockGetResourceDefinition).toHaveBeenCalledTimes(1);
    });

    it('should maintain consistent data structure across re-renders', async () => {
      const { result, rerender } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialData = result.current.data;

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(initialData);
    });

    it('should handle component unmounting gracefully', async () => {
      const { result, unmount } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(() => unmount()).not.toThrow();
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

      const query = { resource_definitions: ['test-resource-def'] };

      const { result: result1 } = renderHook(() => useResourceDefinitions(query), {
        wrapper: cachingWrapper,
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(() => useResourceDefinitions(query), {
        wrapper: cachingWrapper,
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should only call API once due to caching when using caching-enabled client
      expect(mockGetResourceDefinition).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);
    });

    it('should handle large datasets efficiently', async () => {
      const largeResourceDefinitionList = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          name: `resource-def-${i}`,
          resource_group_name: `group-${i % 10}`,
          props: {
            'Aux/description': `Resource definition ${i}`,
            'Aux/index': i.toString(),
          },
          volume_definitions: [
            {
              volume_number: 0,
              size_kib: (i + 1) * 1048576, // Variable sizes
            },
          ],
        })),
      };

      mockGetResourceDefinition.mockResolvedValue(largeResourceDefinitionList);

      const start = performance.now();
      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const end = performance.now();

      expect(result.current.data).toHaveLength(1000);
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration with React Query', () => {
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

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: customWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResourceDefinitionData.data);
    });

    it('should provide all React Query properties', async () => {
      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that all expected properties are available
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('data');

      // isLoading, error, and data are the only properties exposed by the hook
      expect(Object.keys(result.current).sort()).toEqual(['data', 'error', 'isLoading']);
    });

    it('should handle query invalidation', async () => {
      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledTimes(1);

      // Invalidate the query
      await queryClient.invalidateQueries(['getResources', undefined]);

      await waitFor(() => {
        expect(mockGetResourceDefinition).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with malformed data structure', async () => {
      const malformedResponse = {
        data: [
          {
            // Missing name property
            resource_group_name: 'test',
          },
          {
            name: 'valid-resource-def',
            // Missing resource_group_name
            props: {},
          },
        ],
      };

      mockGetResourceDefinition.mockResolvedValue(malformedResponse);

      const { result } = renderHook(() => useResourceDefinitions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(malformedResponse.data);
      expect(result.current.error).toBeNull();
    });

    it('should handle concurrent hook instances with different queries', async () => {
      const query1 = { resource_definitions: ['resource-1'] };
      const query2 = { resource_definitions: ['resource-2'] };

      const { result: result1 } = renderHook(() => useResourceDefinitions(query1), {
        wrapper: createWrapper(),
      });

      const { result: result2 } = renderHook(() => useResourceDefinitions(query2), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query1);
      expect(mockGetResourceDefinition).toHaveBeenCalledWith(query2);
      expect(mockGetResourceDefinition).toHaveBeenCalledTimes(2);
    });

    it('should handle query with undefined values', async () => {
      const queryWithUndefined = {
        resource_definitions: undefined,
        props: ['Aux/description'],
        with_volume_definitions: undefined,
      };

      const { result } = renderHook(() => useResourceDefinitions(queryWithUndefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetResourceDefinition).toHaveBeenCalledWith(queryWithUndefined);
    });
  });
});
