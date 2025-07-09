// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { checkPort, volumeSize, convertRoundUp, sizeOptions, formatBytes, kibToGib } from '../size';

describe('size utils', () => {
  describe('checkPort', () => {
    it('should accept valid ports', () => {
      const callback = vi.fn();

      checkPort(null, '80', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      checkPort(null, '443', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      checkPort(null, '8080', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      checkPort(null, '65534', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      checkPort(null, '1', callback);
      expect(callback).toHaveBeenCalledWith();
    });

    it('should reject invalid ports', () => {
      const callback = vi.fn();

      // Port 0
      checkPort(null, '0', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));

      callback.mockClear();
      // Port > 65534
      checkPort(null, '65535', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));

      callback.mockClear();
      // Non-numeric
      checkPort(null, 'abc', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));

      callback.mockClear();
      // Empty string
      checkPort(null, '', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));

      callback.mockClear();
      // Too many digits
      checkPort(null, '123456', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));

      callback.mockClear();
      // Negative number
      checkPort(null, '-1', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));

      callback.mockClear();
      // Float number
      checkPort(null, '80.5', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Port range is 1~65534'));
    });
  });

  describe('volumeSize', () => {
    it('should accept valid volume sizes', () => {
      const callback = vi.fn();

      // Minimum size (4)
      volumeSize(null, '4', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      // Medium size
      volumeSize(null, '1024', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      // Large size
      volumeSize(null, '1073741824', callback);
      expect(callback).toHaveBeenCalledWith();

      callback.mockClear();
      // Maximum size
      volumeSize(null, '1099511627776', callback);
      expect(callback).toHaveBeenCalledWith();
    });

    it('should reject invalid volume sizes', () => {
      const callback = vi.fn();

      // Below minimum
      volumeSize(null, '3', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Volume Size Range Error'));

      callback.mockClear();
      // Above maximum
      volumeSize(null, '1099511627777', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Volume Size Range Error'));

      callback.mockClear();
      // Non-numeric
      volumeSize(null, 'abc', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Volume Size Range Error'));

      callback.mockClear();
      // Empty string
      volumeSize(null, '', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Volume Size Range Error'));

      callback.mockClear();
      // Float number
      volumeSize(null, '10.5', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Volume Size Range Error'));

      callback.mockClear();
      // Negative number
      volumeSize(null, '-1', callback);
      expect(callback).toHaveBeenCalledWith(new Error('Volume Size Range Error'));
    });
  });

  describe('convertRoundUp', () => {
    it('should convert different units to KiB correctly', () => {
      // Test basic conversions
      expect(convertRoundUp('KiB', 1)).toBe(1);
      expect(convertRoundUp('MiB', 1)).toBe(1024);
      expect(convertRoundUp('GiB', 1)).toBe(1048576);
      expect(convertRoundUp('TiB', 1)).toBe(1073741824);
    });

    it('should handle decimal conversions with rounding up', () => {
      // Test rounding up behavior
      expect(convertRoundUp('B', 1023)).toBe(1); // Should round up to 1 KiB
      expect(convertRoundUp('B', 1024)).toBe(1); // Should be exactly 1 KiB
    });

    it('should handle various unit formats', () => {
      expect(convertRoundUp('MB', 1)).toBe(977);
      expect(convertRoundUp('GB', 1)).toBe(976563);
      expect(convertRoundUp('TB', 1)).toBe(976562500);
    });
  });

  describe('sizeOptions', () => {
    it('should contain correct size options', () => {
      expect(sizeOptions).toEqual([
        { value: 'KiB', label: 'KiB' },
        { value: 'MiB', label: 'MiB' },
        { value: 'GiB', label: 'GiB' },
        { value: 'TiB', label: 'TiB' },
      ]);
    });

    it('should have all options with value and label properties', () => {
      sizeOptions.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });
  });

  describe('formatBytes', () => {
    it('should handle zero bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should handle non-number input', () => {
      expect(formatBytes('invalid' as unknown as number)).toBe('NaN');
      expect(formatBytes(null as unknown as number)).toBe('NaN');
      expect(formatBytes(undefined as unknown as number)).toBe('NaN');
    });

    it('should handle bytes less than 1', () => {
      expect(formatBytes(0.5)).toBe('512 Bytes');
      expect(formatBytes(0.25)).toBe('256 Bytes');
    });

    it('should format KiB correctly', () => {
      expect(formatBytes(1)).toBe('1.00 KiB');
      expect(formatBytes(512)).toBe('512.00 KiB');
      expect(formatBytes(1023)).toBe('1023.00 KiB');
    });

    it('should format MiB correctly', () => {
      expect(formatBytes(1024)).toBe('1.00 MiB');
      expect(formatBytes(2048)).toBe('2.00 MiB');
      expect(formatBytes(1536)).toBe('1.50 MiB');
    });

    it('should format GiB correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 GiB');
      expect(formatBytes(2 * 1024 * 1024)).toBe('2.00 GiB');
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.50 GiB');
    });

    it('should format TiB correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 TiB');
      expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.00 TiB');
    });

    it('should format PiB correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.00 PiB');
      expect(formatBytes(2 * 1024 * 1024 * 1024 * 1024)).toBe('2.00 PiB');
    });

    it('should handle very large values', () => {
      const veryLarge = 1024 * 1024 * 1024 * 1024 * 1024;
      const result = formatBytes(veryLarge);
      expect(result).toContain('PiB');
      expect(result).toContain('1024.00');
    });
  });

  describe('kibToGib', () => {
    it('should convert KiB to GiB correctly', () => {
      expect(kibToGib(0)).toBe(0);
      expect(kibToGib(1048576)).toBe(1); // 1 GiB in KiB
      expect(kibToGib(2097152)).toBe(2); // 2 GiB in KiB
      expect(kibToGib(1572864)).toBe(1.5); // 1.5 GiB in KiB
    });

    it('should handle small values', () => {
      expect(kibToGib(1024)).toBe(0); // Should be 0.00 when rounded
      expect(kibToGib(524288)).toBe(0.5); // 0.5 GiB in KiB
    });

    it('should handle large values', () => {
      expect(kibToGib(10485760)).toBe(10); // 10 GiB in KiB
      expect(kibToGib(1073741824)).toBe(1024); // 1024 GiB in KiB
    });

    it('should round to 2 decimal places', () => {
      expect(kibToGib(1048576 + 1024)).toBe(1); // Should round 1.001 to 1.00
      expect(kibToGib(1048576 + 51200)).toBe(1.05); // Should be 1.05
    });
  });
});
