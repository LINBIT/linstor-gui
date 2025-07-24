// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useIsAdmin from '../useIsAdmin';

describe('useIsAdmin', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('admin detection', () => {
    it('should return true when localStorage contains "admin"', () => {
      localStorageMock.getItem.mockReturnValue('admin');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('linstorname');
    });

    it('should return false when localStorage contains non-admin value', () => {
      localStorageMock.getItem.mockReturnValue('user');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('linstorname');
    });

    it('should return false when localStorage is empty/null', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('linstorname');
    });

    it('should return false when localStorage is undefined', () => {
      localStorageMock.getItem.mockReturnValue(undefined);

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });

    it('should return false for empty string', () => {
      localStorageMock.getItem.mockReturnValue('');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });
  });

  describe('case sensitivity', () => {
    it('should return false for "Admin" (uppercase A)', () => {
      localStorageMock.getItem.mockReturnValue('Admin');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });

    it('should return false for "ADMIN" (all uppercase)', () => {
      localStorageMock.getItem.mockReturnValue('ADMIN');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });

    it('should return true only for exact "admin" lowercase', () => {
      localStorageMock.getItem.mockReturnValue('admin');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should return false for whitespace around admin', () => {
      localStorageMock.getItem.mockReturnValue(' admin ');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });

    it('should return false for admin with special characters', () => {
      localStorageMock.getItem.mockReturnValue('admin123');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });

    it('should return false for partial admin string', () => {
      localStorageMock.getItem.mockReturnValue('admi');

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });

    it('should handle localStorage getItem throwing error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const { result } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);
    });
  });

  describe('hook behavior', () => {
    it('should return boolean type', () => {
      localStorageMock.getItem.mockReturnValue('admin');

      const { result } = renderHook(() => useIsAdmin());

      expect(typeof result.current).toBe('boolean');
    });

    it('should be consistent across multiple calls', () => {
      localStorageMock.getItem.mockReturnValue('admin');

      const { result, rerender } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(true);

      rerender();

      expect(result.current).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(2); // Called on each render
    });

    it('should reflect localStorage changes between hook calls', () => {
      // First call - not admin
      localStorageMock.getItem.mockReturnValue('user');

      const { result, rerender } = renderHook(() => useIsAdmin());

      expect(result.current).toBe(false);

      // Simulate localStorage change
      localStorageMock.getItem.mockReturnValue('admin');

      rerender();

      expect(result.current).toBe(true);
    });

    it('should work with multiple hook instances', () => {
      localStorageMock.getItem.mockReturnValue('admin');

      const { result: result1 } = renderHook(() => useIsAdmin());
      const { result: result2 } = renderHook(() => useIsAdmin());

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result1.current).toBe(result2.current);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle different user types correctly', () => {
      const testCases = [
        { value: 'admin', expected: true },
        { value: 'user', expected: false },
        { value: 'moderator', expected: false },
        { value: 'guest', expected: false },
        { value: 'administrator', expected: false },
        { value: 'root', expected: false },
        { value: 'superuser', expected: false },
      ];

      testCases.forEach(({ value, expected }) => {
        localStorageMock.getItem.mockReturnValue(value);

        const { result } = renderHook(() => useIsAdmin());

        expect(result.current).toBe(expected);
      });
    });

    it('should handle session scenarios', () => {
      // Simulate login as admin
      localStorageMock.getItem.mockReturnValue('admin');
      const { result: adminResult } = renderHook(() => useIsAdmin());
      expect(adminResult.current).toBe(true);

      // Simulate logout (localStorage cleared)
      localStorageMock.getItem.mockReturnValue(null);
      const { result: logoutResult } = renderHook(() => useIsAdmin());
      expect(logoutResult.current).toBe(false);

      // Simulate login as regular user
      localStorageMock.getItem.mockReturnValue('john_doe');
      const { result: userResult } = renderHook(() => useIsAdmin());
      expect(userResult.current).toBe(false);
    });
  });
});
