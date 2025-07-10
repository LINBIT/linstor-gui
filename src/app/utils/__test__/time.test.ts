// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { formatTime, formatTimeUTC, getTime } from '../time';

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

describe('formatTimeUTC', () => {
  it('should format a Unix timestamp into a UTC time string', () => {
    const timestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
    const expected = '2023-01-01 00:00:00';
    expect(formatTimeUTC(timestamp)).toBe(expected);
  });

  it('should use the provided format string for UTC time', () => {
    const timestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
    const format = 'YYYY/MM/DD HH:mm';
    const expected = '2023/01/01 00:00';
    expect(formatTimeUTC(timestamp, format)).toBe(expected);
  });

  it('should handle different timestamps consistently in UTC', () => {
    const summerTimestamp = 1656633600000; // 2022-07-01 00:00:00 UTC
    const winterTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC

    expect(formatTimeUTC(summerTimestamp)).toBe('2022-07-01 00:00:00');
    expect(formatTimeUTC(winterTimestamp)).toBe('2022-01-01 00:00:00');
  });

  it('should format with custom format in UTC', () => {
    const timestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
    const format = 'DD/MM/YYYY HH:mm:ss';
    const expected = '01/01/2023 00:00:00';
    expect(formatTimeUTC(timestamp, format)).toBe(expected);
  });
});

describe('getTime', () => {
  it('should convert string date to Unix timestamp', () => {
    const dateString = '2023-01-01';
    const result = getTime(dateString);
    expect(typeof result).toBe('number');
    expect(result).toBe(1672531200000); // 2023-01-01 00:00:00 UTC
  });

  it('should convert number to Unix timestamp', () => {
    const timestamp = 1672531200000;
    const result = getTime(timestamp);
    expect(result).toBe(timestamp);
  });

  it('should convert Date object to Unix timestamp', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const result = getTime(date);
    expect(result).toBe(1672531200000);
  });

  it('should handle null input', () => {
    const result = getTime(null);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(true);
  });

  it('should handle undefined input', () => {
    const result = getTime(undefined);
    expect(typeof result).toBe('number');
    // dayjs(undefined) returns current timestamp, not NaN
    expect(result).toBeGreaterThan(0);
  });

  it('should handle empty string', () => {
    const result = getTime('');
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(true);
  });

  it('should handle invalid date string', () => {
    const result = getTime('invalid-date');
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(true);
  });

  it('should handle dayjs object', () => {
    // We need to import dayjs to create a dayjs object for testing
    const dayjsObject = dayjs('2023-01-01');
    const result = getTime(dayjsObject);
    expect(result).toBe(1672531200000);
  });
});
