// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSpaceReport, SPACE_TRACKING_UNAVAILABLE_MSG } from '../spaceReport';

const mockGet = vi.fn();

vi.mock('@app/requests', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('getSpaceReport', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('successful responses', () => {
    it('should return report text on successful response', async () => {
      const mockReportText = 'Space report data';
      mockGet.mockResolvedValueOnce({
        data: { reportText: mockReportText },
      });

      const result = await getSpaceReport();

      expect(result).toBe(mockReportText);
      expect(mockGet).toHaveBeenCalledWith('/v1/space-report');
    });

    it('should return SPACE_TRACKING_UNAVAILABLE_MSG when service is unavailable', async () => {
      mockGet.mockResolvedValueOnce({
        data: { reportText: SPACE_TRACKING_UNAVAILABLE_MSG },
      });

      const result = await getSpaceReport();

      expect(result).toBe(SPACE_TRACKING_UNAVAILABLE_MSG);
    });
  });

  describe('error responses', () => {
    it('should return null when the request throws an error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle response with no reportText property', async () => {
      mockGet.mockResolvedValueOnce({
        data: {},
      });

      const result = await getSpaceReport();

      expect(result).toBeUndefined();
    });

    it('should handle response with null reportText', async () => {
      mockGet.mockResolvedValueOnce({
        data: { reportText: null },
      });

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });

    it('should handle empty response', async () => {
      mockGet.mockResolvedValueOnce({
        data: null,
      });

      const result = await getSpaceReport();

      expect(result).toBeNull();
    });
  });
});
