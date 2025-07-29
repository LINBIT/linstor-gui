// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSpaceReport, SPACE_TRACKING_UNAVAILABLE_MSG } from '../spaceReport';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
};

// Mock fetch
const mockFetch = vi.fn();

describe('getSpaceReport', () => {
  beforeEach(() => {
    // Clear localStorage mock
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockFetch.mockClear();

    // Mock localStorage and fetch
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful responses', () => {
    it('should return report text on successful response', async () => {
      const mockReportText = 'Space report data';
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reportText: mockReportText }),
      });

      const result = await getSpaceReport();

      expect(result).toBe(mockReportText);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/v1/space-report');
    });

    it('should use empty string as default host when localStorage is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reportText: 'Space report data' }),
      });

      await getSpaceReport();

      expect(mockFetch).toHaveBeenCalledWith('/v1/space-report');
    });

    it('should return SPACE_TRACKING_UNAVAILABLE_MSG when service is unavailable', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reportText: SPACE_TRACKING_UNAVAILABLE_MSG }),
      });

      const result = await getSpaceReport();

      expect(result).toBe(SPACE_TRACKING_UNAVAILABLE_MSG);
    });
  });

  describe('error responses', () => {
    it('should return null when response is not ok', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });

    it('should return null when fetch throws an error', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle response with no reportText property', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await getSpaceReport();

      expect(result).toBeUndefined();
    });

    it('should handle response with null reportText', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reportText: null }),
      });

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });

    it('should handle empty response', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });
  });

  describe('localStorage variations', () => {
    it('should work with different host formats', async () => {
      const testCases = [
        'http://localhost:8080',
        'https://api.example.com',
        'https://api.example.com:9090',
        'http://192.168.1.100:8080',
      ];

      for (const host of testCases) {
        mockLocalStorage.setItem('LINSTOR_HOST', host);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ reportText: 'test data' }),
        });

        await getSpaceReport();

        expect(mockFetch).toHaveBeenCalledWith(`${host}/v1/space-report`);
        mockFetch.mockClear();
      }
    });

    it('should handle host with trailing slash', async () => {
      mockLocalStorage.setItem('LINSTOR_HOST', 'http://localhost:8080/');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reportText: 'test data' }),
      });

      await getSpaceReport();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080//v1/space-report');
    });
  });
});
