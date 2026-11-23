// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { convertRoundUp, sizeOptions, formatBytes, kibToGib } from '../size';

describe('size utils', () => {
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
