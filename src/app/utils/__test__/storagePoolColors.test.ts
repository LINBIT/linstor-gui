// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import {
  BASE_STORAGE_POOL_COLORS,
  NODE_TOTAL_COLOR,
  hexToRgba,
  generateStoragePoolColorPairs,
  getStoragePoolColor,
  getStoragePoolColorPair,
  getNodeTotalColorPair,
} from '../storagePoolColors';

describe('storagePoolColors', () => {
  describe('hexToRgba', () => {
    it('should convert hex color to rgba with specified opacity', () => {
      expect(hexToRgba('#F79133', 0.5)).toBe('rgba(247, 145, 51, 0.5)');
      expect(hexToRgba('#499BBB', 0.2)).toBe('rgba(73, 155, 187, 0.2)');
      expect(hexToRgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)');
      expect(hexToRgba('#FFFFFF', 0)).toBe('rgba(255, 255, 255, 0)');
    });

    it('should work with or without # prefix', () => {
      expect(hexToRgba('F79133', 0.5)).toBe('rgba(247, 145, 51, 0.5)');
      expect(hexToRgba('#F79133', 0.5)).toBe('rgba(247, 145, 51, 0.5)');
    });

    it('should throw error for invalid hex format', () => {
      expect(() => hexToRgba('invalid', 0.5)).toThrow('Invalid hex color format');
      expect(() => hexToRgba('#FFF', 0.5)).toThrow('Invalid hex color format');
      expect(() => hexToRgba('#GGGGGG', 0.5)).toThrow('Invalid hex color format');
    });
  });

  describe('generateStoragePoolColorPairs', () => {
    it('should generate correct number of color pairs', () => {
      const pairs1 = generateStoragePoolColorPairs(1);
      expect(pairs1).toHaveLength(1);

      const pairs5 = generateStoragePoolColorPairs(5);
      expect(pairs5).toHaveLength(5);

      const pairs15 = generateStoragePoolColorPairs(15);
      expect(pairs15).toHaveLength(15);
    });

    it('should generate color pairs with used and free colors', () => {
      const pairs = generateStoragePoolColorPairs(3);

      pairs.forEach((pair) => {
        expect(pair).toHaveProperty('used');
        expect(pair).toHaveProperty('free');
        expect(pair.used).toMatch(/^#[0-9A-F]{6}$/i);
        expect(pair.free).toMatch(/^rgba\(\d+, \d+, \d+, 0\.2\)$/);
      });
    });

    it('should use correct base colors in order', () => {
      const pairs = generateStoragePoolColorPairs(3);

      expect(pairs[0].used).toBe('#F79133');
      expect(pairs[1].used).toBe('#499BBB');
      expect(pairs[2].used).toBe('#E1C047');

      expect(pairs[0].free).toBe('rgba(247, 145, 51, 0.2)');
      expect(pairs[1].free).toBe('rgba(73, 155, 187, 0.2)');
      expect(pairs[2].free).toBe('rgba(225, 192, 71, 0.2)');
    });

    it('should cycle through colors when count exceeds base colors', () => {
      const baseColorsCount = BASE_STORAGE_POOL_COLORS.length;
      const pairs = generateStoragePoolColorPairs(baseColorsCount + 2);

      // Should cycle back to first colors
      expect(pairs[baseColorsCount].used).toBe(pairs[0].used);
      expect(pairs[baseColorsCount + 1].used).toBe(pairs[1].used);
    });
  });

  describe('getStoragePoolColor', () => {
    it('should return correct color for index', () => {
      expect(getStoragePoolColor(0)).toBe('#F79133');
      expect(getStoragePoolColor(1)).toBe('#499BBB');
      expect(getStoragePoolColor(2)).toBe('#E1C047');
    });

    it('should cycle through colors for large indices', () => {
      const baseColorsCount = BASE_STORAGE_POOL_COLORS.length;
      expect(getStoragePoolColor(baseColorsCount)).toBe(BASE_STORAGE_POOL_COLORS[0]);
      expect(getStoragePoolColor(baseColorsCount + 1)).toBe(BASE_STORAGE_POOL_COLORS[1]);
    });
  });

  describe('getStoragePoolColorPair', () => {
    it('should return color pair with used and free colors', () => {
      const pair0 = getStoragePoolColorPair(0);
      expect(pair0.used).toBe('#F79133');
      expect(pair0.free).toBe('rgba(247, 145, 51, 0.2)');

      const pair1 = getStoragePoolColorPair(1);
      expect(pair1.used).toBe('#499BBB');
      expect(pair1.free).toBe('rgba(73, 155, 187, 0.2)');
    });

    it('should handle cycling for large indices', () => {
      const baseColorsCount = BASE_STORAGE_POOL_COLORS.length;
      const pair = getStoragePoolColorPair(baseColorsCount);
      expect(pair.used).toBe(BASE_STORAGE_POOL_COLORS[0]);
    });
  });

  describe('getNodeTotalColorPair', () => {
    it('should return node total color pair', () => {
      const nodePair = getNodeTotalColorPair();
      expect(nodePair.used).toBe(NODE_TOTAL_COLOR);
      expect(nodePair.free).toBe(`rgba(63, 63, 63, 0.2)`);
    });

    it('should always return the same colors', () => {
      const pair1 = getNodeTotalColorPair();
      const pair2 = getNodeTotalColorPair();

      expect(pair1.used).toBe(pair2.used);
      expect(pair1.free).toBe(pair2.free);
    });
  });

  describe('constants', () => {
    it('should have correct base storage pool colors', () => {
      expect(BASE_STORAGE_POOL_COLORS).toHaveLength(10);
      expect(BASE_STORAGE_POOL_COLORS[0]).toBe('#F79133');
      expect(BASE_STORAGE_POOL_COLORS[1]).toBe('#499BBB');

      // All colors should be valid hex format
      BASE_STORAGE_POOL_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should have correct node total color', () => {
      expect(NODE_TOTAL_COLOR).toBe('#3F3F3F');
      expect(NODE_TOTAL_COLOR).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
