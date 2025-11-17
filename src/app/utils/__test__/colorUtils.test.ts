// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { SVG_COLOR_FILTERS, getSvgColorFilter, createSvgColorStyle } from '../colorUtils';

describe('colorUtils', () => {
  describe('SVG_COLOR_FILTERS', () => {
    it('should contain all expected color filters', () => {
      expect(SVG_COLOR_FILTERS).toHaveProperty('orange');
      expect(SVG_COLOR_FILTERS).toHaveProperty('white');
      expect(SVG_COLOR_FILTERS).toHaveProperty('black');
      expect(SVG_COLOR_FILTERS).toHaveProperty('brandOrange');
      expect(SVG_COLOR_FILTERS).toHaveProperty('red');
      expect(SVG_COLOR_FILTERS).toHaveProperty('green');
    });

    it('should have valid CSS filter strings', () => {
      // Check that all filters are non-empty strings
      Object.values(SVG_COLOR_FILTERS).forEach((filter) => {
        expect(typeof filter).toBe('string');
        expect(filter.length).toBeGreaterThan(0);
      });
    });

    it('should have specific filter values for key colors', () => {
      expect(SVG_COLOR_FILTERS.orange).toBe(
        'invert(65%) sepia(94%) saturate(1166%) hue-rotate(347deg) brightness(103%) contrast(91%)',
      );
      expect(SVG_COLOR_FILTERS.brandOrange).toBe(SVG_COLOR_FILTERS.orange);
      expect(SVG_COLOR_FILTERS.white).toBe('brightness(0) saturate(100%) invert(1)');
      expect(SVG_COLOR_FILTERS.black).toBe('brightness(0) saturate(100%) invert(0)');
    });

    it('should have brandOrange equal to orange', () => {
      expect(SVG_COLOR_FILTERS.brandOrange).toBe(SVG_COLOR_FILTERS.orange);
    });
  });

  describe('getSvgColorFilter', () => {
    it('should return correct filter for valid color keys', () => {
      expect(getSvgColorFilter('orange')).toBe(SVG_COLOR_FILTERS.orange);
      expect(getSvgColorFilter('white')).toBe(SVG_COLOR_FILTERS.white);
      expect(getSvgColorFilter('black')).toBe(SVG_COLOR_FILTERS.black);
      expect(getSvgColorFilter('brandOrange')).toBe(SVG_COLOR_FILTERS.brandOrange);
      expect(getSvgColorFilter('red')).toBe(SVG_COLOR_FILTERS.red);
      expect(getSvgColorFilter('green')).toBe(SVG_COLOR_FILTERS.green);
    });

    it('should return the same value as direct access to SVG_COLOR_FILTERS', () => {
      const colors = ['orange', 'white', 'black', 'brandOrange', 'red', 'green'] as const;

      colors.forEach((color) => {
        expect(getSvgColorFilter(color)).toBe(SVG_COLOR_FILTERS[color]);
      });
    });
  });

  describe('createSvgColorStyle', () => {
    it('should create style object with filter property', () => {
      const style = createSvgColorStyle('orange');

      expect(style).toHaveProperty('filter');
      expect(style.filter).toBe(SVG_COLOR_FILTERS.orange);
    });

    it('should merge additional styles with filter', () => {
      const additionalStyles = {
        marginLeft: 10,
        marginRight: '1rem',
        width: 16,
        height: 16,
      };

      const style = createSvgColorStyle('brandOrange', additionalStyles);

      expect(style).toEqual({
        filter: SVG_COLOR_FILTERS.brandOrange,
        marginLeft: 10,
        marginRight: '1rem',
        width: 16,
        height: 16,
      });
    });

    it('should work with empty additional styles', () => {
      const style = createSvgColorStyle('white', {});

      expect(style).toEqual({
        filter: SVG_COLOR_FILTERS.white,
      });
    });

    it('should work without additional styles parameter', () => {
      const style = createSvgColorStyle('black');

      expect(style).toEqual({
        filter: SVG_COLOR_FILTERS.black,
      });
    });

    it('should override filter if provided in additional styles', () => {
      const customFilter = 'brightness(50%)';
      const additionalStyles = {
        filter: customFilter,
        color: 'red',
      };

      const style = createSvgColorStyle('green', additionalStyles);

      // Additional styles should override the filter from getSvgColorFilter
      expect(style).toEqual({
        filter: customFilter,
        color: 'red',
      });
    });

    it('should work with all available color keys', () => {
      const colors = ['orange', 'white', 'black', 'brandOrange', 'red', 'green'] as const;

      colors.forEach((color) => {
        const style = createSvgColorStyle(color);
        expect(style.filter).toBe(SVG_COLOR_FILTERS[color]);
      });
    });

    it('should create proper React.CSSProperties type', () => {
      const style = createSvgColorStyle('orange', {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '4px',
      });

      // This test ensures type compatibility
      expect(typeof style).toBe('object');
      expect(style.display).toBe('flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.padding).toBe('8px');
      expect(style.borderRadius).toBe('4px');
      expect(style.filter).toBe(SVG_COLOR_FILTERS.orange);
    });
  });

  describe('Integration tests', () => {
    it('should work together for common use case', () => {
      // Test the typical usage pattern
      const filter = getSvgColorFilter('brandOrange');
      const style = createSvgColorStyle('brandOrange', {
        marginLeft: 2,
        marginRight: '1rem',
      });

      expect(filter).toBe(SVG_COLOR_FILTERS.brandOrange);
      expect(style.filter).toBe(filter);
      expect(style.marginLeft).toBe(2);
      expect(style.marginRight).toBe('1rem');
    });

    it('should handle all colors consistently', () => {
      const colors = ['orange', 'white', 'black', 'brandOrange', 'red', 'green'] as const;

      colors.forEach((color) => {
        const filter = getSvgColorFilter(color);
        const style = createSvgColorStyle(color);

        expect(filter).toBe(SVG_COLOR_FILTERS[color]);
        expect(style.filter).toBe(filter);
      });
    });
  });
});
