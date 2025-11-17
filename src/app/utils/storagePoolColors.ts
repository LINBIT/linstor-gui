// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * Common storage pool color utilities
 */

// Base colors for storage pools
export const BASE_STORAGE_POOL_COLORS = [
  '#F79133',
  '#499BBB',
  '#E1C047',
  '#65BDED',
  '#C0854E',
  '#84E4E9',
  '#FF6D6D',
  '#5FD4A9',
  '#C38EC8',
  '#BBD45F',
];

// Node total colors
export const NODE_TOTAL_COLOR = '#3F3F3F';

// Convert hex color to rgba with specified opacity
export const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color format');
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Color pair for used/free display
export interface ColorPair {
  used: string;
  free: string;
}

/**
 * Generate color pairs for storage pools
 * Each pool gets a color pair with used (full color) and free (20% opacity)
 */
export const generateStoragePoolColorPairs = (count: number): ColorPair[] => {
  const basePairs = BASE_STORAGE_POOL_COLORS.map((color) => ({
    used: color,
    free: hexToRgba(color, 0.2),
  }));

  const result: ColorPair[] = [];
  for (let i = 0; i < count; i++) {
    result.push(basePairs[i % basePairs.length]);
  }
  return result;
};

/**
 * Get color for a specific storage pool by index
 */
export const getStoragePoolColor = (index: number): string => {
  return BASE_STORAGE_POOL_COLORS[index % BASE_STORAGE_POOL_COLORS.length];
};

/**
 * Get color pair for a specific storage pool by index
 */
export const getStoragePoolColorPair = (index: number): ColorPair => {
  const color = getStoragePoolColor(index);
  return {
    used: color,
    free: hexToRgba(color, 0.2),
  };
};

/**
 * Get node total color pair
 */
export const getNodeTotalColorPair = (): ColorPair => ({
  used: NODE_TOTAL_COLOR,
  free: hexToRgba(NODE_TOTAL_COLOR, 0.2),
});
