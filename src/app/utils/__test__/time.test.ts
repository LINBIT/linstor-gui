// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { formatTime } from '../time';

describe('formatTime', () => {
  it('should format a Unix timestamp into a human-readable string', () => {
    // Note: This test uses UTC timezone (set in setupTests.ts) to ensure
    // consistent results across different machines and time zones
    const timestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
    const expected = '2023-01-01 00:00:00';
    expect(formatTime(timestamp)).toBe(expected);
  });

  it('should use the provided format string', () => {
    // Note: This test uses UTC timezone (set in setupTests.ts) to ensure
    // consistent results across different machines and time zones
    const timestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
    const format = 'YYYY/MM/DD';
    const expected = '2023/01/01';
    expect(formatTime(timestamp, format)).toBe(expected);
  });

  it('should handle different timestamps consistently', () => {
    // Test with different timestamps to ensure timezone handling is consistent
    const summerTimestamp = 1656633600000; // 2022-07-01 00:00:00 UTC
    const winterTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
    
    expect(formatTime(summerTimestamp)).toBe('2022-07-01 00:00:00');
    expect(formatTime(winterTimestamp)).toBe('2022-01-01 00:00:00');
  });
});
