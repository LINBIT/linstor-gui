// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWindowSize } from '../useWindowSize';

describe('useWindowSize', () => {
  // Store original window dimensions
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  // Mock resize event
  const mockResizeEvent = () => {
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  };

  beforeEach(() => {
    // Reset window dimensions to known values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('initialization', () => {
    it('should return initial window dimensions', () => {
      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });
    });

    it('should return correct interface structure', () => {
      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toHaveProperty('width');
      expect(result.current).toHaveProperty('height');
      expect(typeof result.current.width).toBe('number');
      expect(typeof result.current.height).toBe('number');
    });
  });

  describe('resize handling', () => {
    it('should update dimensions when window is resized', () => {
      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toEqual({ width: 1024, height: 768 });

      // Change window dimensions
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
        mockResizeEvent();
      });

      expect(result.current).toEqual({ width: 1200, height: 900 });
    });

    it('should handle multiple resize events', () => {
      const { result } = renderHook(() => useWindowSize());

      // First resize
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
        mockResizeEvent();
      });

      expect(result.current).toEqual({ width: 800, height: 600 });

      // Second resize
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
        mockResizeEvent();
      });

      expect(result.current).toEqual({ width: 1440, height: 900 });

      // Third resize
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 320, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 568, writable: true });
        mockResizeEvent();
      });

      expect(result.current).toEqual({ width: 320, height: 568 });
    });

    it('should handle rapid resize events', () => {
      const { result } = renderHook(() => useWindowSize());

      act(() => {
        // Rapid resize changes
        Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });
        mockResizeEvent();

        Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });
        mockResizeEvent();

        Object.defineProperty(window, 'innerWidth', { value: 700, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
        mockResizeEvent();
      });

      // Should reflect the last resize
      expect(result.current).toEqual({ width: 700, height: 600 });
    });
  });

  describe('event listener management', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useWindowSize());

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useWindowSize());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should call resize handler initially to ensure correct values', () => {
      // Change dimensions before mounting
      Object.defineProperty(window, 'innerWidth', { value: 1600, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1200, writable: true });

      const { result } = renderHook(() => useWindowSize());

      // Should reflect the current window dimensions immediately
      expect(result.current).toEqual({ width: 1600, height: 1200 });
    });
  });

  describe('edge cases', () => {
    it('should handle zero dimensions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 0, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 0, writable: true });

      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toEqual({ width: 0, height: 0 });
    });

    it('should handle very large dimensions', () => {
      const largeWidth = 999999;
      const largeHeight = 888888;

      Object.defineProperty(window, 'innerWidth', { value: largeWidth, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: largeHeight, writable: true });

      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toEqual({ width: largeWidth, height: largeHeight });
    });

    it('should handle negative dimensions (edge case)', () => {
      Object.defineProperty(window, 'innerWidth', { value: -100, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: -200, writable: true });

      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toEqual({ width: -100, height: -200 });
    });

    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useWindowSize());

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1366, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
        mockResizeEvent();
      });

      const dimensionsAfterResize = result.current;

      rerender();

      expect(result.current).toEqual(dimensionsAfterResize);
    });
  });

  describe('multiple hook instances', () => {
    it('should work correctly with multiple instances', () => {
      const { result: result1 } = renderHook(() => useWindowSize());
      const { result: result2 } = renderHook(() => useWindowSize());

      expect(result1.current).toEqual(result2.current);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
        mockResizeEvent();
      });

      expect(result1.current).toEqual({ width: 1920, height: 1080 });
      expect(result2.current).toEqual({ width: 1920, height: 1080 });
      expect(result1.current).toEqual(result2.current);
    });
  });
});
