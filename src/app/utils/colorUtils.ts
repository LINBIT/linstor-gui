// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * CSS filter utilities for changing SVG colors
 */

// Common color filters for SVG icons
export const SVG_COLOR_FILTERS = {
  // Orange #f79133
  orange: 'invert(65%) sepia(94%) saturate(1166%) hue-rotate(347deg) brightness(103%) contrast(91%)',
  // White
  white: 'brightness(0) saturate(100%) invert(1)',
  // Black
  black: 'brightness(0) saturate(100%) invert(0)',
  // Brand orange (same as orange, but named for context)
  brandOrange: 'invert(65%) sepia(94%) saturate(1166%) hue-rotate(347deg) brightness(103%) contrast(91%)',
  // Red for error states
  red: 'invert(19%) sepia(98%) saturate(7440%) hue-rotate(356deg) brightness(97%) contrast(118%)',
  // Green for success states
  green: 'invert(35%) sepia(98%) saturate(1807%) hue-rotate(88deg) brightness(96%) contrast(101%)',
} as const;

/**
 * Get SVG color filter for a specific color
 * @param color - Color key from SVG_COLOR_FILTERS
 * @returns CSS filter string
 */
export const getSvgColorFilter = (color: keyof typeof SVG_COLOR_FILTERS): string => {
  return SVG_COLOR_FILTERS[color];
};

/**
 * Create style object with SVG color filter
 * @param color - Color key from SVG_COLOR_FILTERS
 * @param additionalStyles - Additional CSS styles
 * @returns Style object with filter applied
 */
export const createSvgColorStyle = (
  color: keyof typeof SVG_COLOR_FILTERS,
  additionalStyles: React.CSSProperties = {},
): React.CSSProperties => {
  return {
    filter: getSvgColorFilter(color),
    ...additionalStyles,
  };
};
