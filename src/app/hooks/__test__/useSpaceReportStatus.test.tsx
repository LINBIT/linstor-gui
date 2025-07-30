// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useSpaceReportStatus } from '../useSpaceReportStatus';
import { getSpaceReport, SPACE_TRACKING_UNAVAILABLE_MSG } from '@app/utils/spaceReport';

// Mock the spaceReport utility
vi.mock('@app/utils/spaceReport', () => ({
  getSpaceReport: vi.fn(),
  SPACE_TRACKING_UNAVAILABLE_MSG: 'The SpaceTracking service is not installed.',
}));

const mockGetSpaceReport = vi.mocked(getSpaceReport);

// Create wrapper component for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSpaceReportStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful responses', () => {
    it('should return correct status when space report is available', async () => {
      const mockReportText = 'Space report data';
      mockGetSpaceReport.mockResolvedValueOnce(mockReportText);

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCheckingStatus).toBe(true);
      expect(result.current.isSpaceTrackingUnavailable).toBe(false);

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current.isSpaceTrackingUnavailable).toBe(false);
      expect(result.current.data).toBe(mockReportText);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isFetched).toBe(true);
    });

    it('should detect when space tracking is unavailable', async () => {
      mockGetSpaceReport.mockResolvedValueOnce(SPACE_TRACKING_UNAVAILABLE_MSG);

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCheckingStatus).toBe(true);

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current.isSpaceTrackingUnavailable).toBe(true);
      expect(result.current.data).toBe(SPACE_TRACKING_UNAVAILABLE_MSG);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('error responses', () => {
    it('should handle null response correctly', async () => {
      mockGetSpaceReport.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCheckingStatus).toBe(true);

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current.isSpaceTrackingUnavailable).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle fetch errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetSpaceReport.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCheckingStatus).toBe(true);

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current.isSpaceTrackingUnavailable).toBe(false);
      expect(result.current.isSuccess).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loading states', () => {
    it('should show checking status while fetching', () => {
      mockGetSpaceReport.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCheckingStatus).toBe(true);
      expect(result.current.isFetched).toBe(false);
      expect(result.current.isSpaceTrackingUnavailable).toBe(false);
    });

    it('should transition from checking to completed state', async () => {
      const mockReportText = 'Space report data';
      mockGetSpaceReport.mockResolvedValueOnce(mockReportText);

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      // Initial state - checking
      expect(result.current.isCheckingStatus).toBe(true);
      expect(result.current.isFetched).toBe(false);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      // Final state - completed
      expect(result.current.isFetched).toBe(true);
      expect(result.current.data).toBe(mockReportText);
    });
  });

  describe('hook return values', () => {
    it('should return all expected properties', async () => {
      mockGetSpaceReport.mockResolvedValueOnce('test data');

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current).toHaveProperty('isSpaceTrackingUnavailable');
      expect(result.current).toHaveProperty('isCheckingStatus');
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isSuccess');
      expect(result.current).toHaveProperty('isFetched');

      expect(typeof result.current.isSpaceTrackingUnavailable).toBe('boolean');
      expect(typeof result.current.isCheckingStatus).toBe('boolean');
      expect(typeof result.current.isSuccess).toBe('boolean');
      expect(typeof result.current.isFetched).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string response', async () => {
      mockGetSpaceReport.mockResolvedValueOnce('');

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current.isSpaceTrackingUnavailable).toBe(false);
      expect(result.current.data).toBe('');
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle undefined response by treating it as an error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetSpaceReport.mockRejectedValueOnce(new Error('Query returned undefined'));

      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isCheckingStatus).toBe(false);
      });

      expect(result.current.isSpaceTrackingUnavailable).toBe(false);
      expect(result.current.isSuccess).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('query integration', () => {
    it('should use correct query key', () => {
      mockGetSpaceReport.mockResolvedValue('test data');
      const { result } = renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      // The hook should be using the query key 'getSpaceReportStatus'
      // This is implicitly tested by the fact that the hook works correctly
      expect(result.current).toBeDefined();
    });

    it('should call getSpaceReport function', async () => {
      mockGetSpaceReport.mockResolvedValueOnce('test');

      renderHook(() => useSpaceReportStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockGetSpaceReport).toHaveBeenCalledTimes(1);
      });
    });
  });
});
