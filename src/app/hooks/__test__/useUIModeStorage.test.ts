// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useUIModeStorage from '../useUIModeStorage';

describe('useUIModeStorage', () => {
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

  describe('initialization', () => {
    it('should initialize with NORMAL mode when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useUIModeStorage());

      expect(result.current.UIMode).toBe('NORMAL');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('__gui__mode');
    });

    it('should initialize with stored NORMAL mode', () => {
      localStorageMock.getItem.mockReturnValue('NORMAL');

      const { result } = renderHook(() => useUIModeStorage());

      expect(result.current.UIMode).toBe('NORMAL');
    });

    it('should initialize with stored HCI mode', () => {
      localStorageMock.getItem.mockReturnValue('HCI');

      const { result } = renderHook(() => useUIModeStorage());

      expect(result.current.UIMode).toBe('HCI');
    });

    it('should default to NORMAL for invalid stored values', () => {
      localStorageMock.getItem.mockReturnValue('INVALID_MODE');

      const { result } = renderHook(() => useUIModeStorage());

      expect(result.current.UIMode).toBe('NORMAL');
    });

    it('should default to NORMAL for VSAN mode (not supported in current logic)', () => {
      localStorageMock.getItem.mockReturnValue('VSAN');

      const { result } = renderHook(() => useUIModeStorage());

      expect(result.current.UIMode).toBe('NORMAL');
    });
  });

  describe('updateUIMode', () => {
    it('should update UI mode to HCI and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('NORMAL');

      const { result } = renderHook(() => useUIModeStorage());

      act(() => {
        result.current.updateUIMode('HCI');
      });

      expect(result.current.UIMode).toBe('HCI');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('__gui__mode', 'HCI');
    });

    it('should update UI mode to NORMAL and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('HCI');

      const { result } = renderHook(() => useUIModeStorage());

      act(() => {
        result.current.updateUIMode('NORMAL');
      });

      expect(result.current.UIMode).toBe('NORMAL');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('__gui__mode', 'NORMAL');
    });

    it('should update UI mode to VSAN and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('NORMAL');

      const { result } = renderHook(() => useUIModeStorage());

      act(() => {
        result.current.updateUIMode('VSAN');
      });

      expect(result.current.UIMode).toBe('VSAN');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('__gui__mode', 'VSAN');
    });
  });

  describe('localStorage persistence', () => {
    it('should save to localStorage on initial render', () => {
      localStorageMock.getItem.mockReturnValue('HCI');

      renderHook(() => useUIModeStorage());

      expect(localStorageMock.setItem).toHaveBeenCalledWith('__gui__mode', 'HCI');
    });

    it('should save to localStorage when mode changes multiple times', () => {
      localStorageMock.getItem.mockReturnValue('NORMAL');

      const { result } = renderHook(() => useUIModeStorage());

      act(() => {
        result.current.updateUIMode('HCI');
      });

      act(() => {
        result.current.updateUIMode('VSAN');
      });

      act(() => {
        result.current.updateUIMode('NORMAL');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(4); // Initial + 3 updates
      expect(localStorageMock.setItem).toHaveBeenNthCalledWith(1, '__gui__mode', 'NORMAL');
      expect(localStorageMock.setItem).toHaveBeenNthCalledWith(2, '__gui__mode', 'HCI');
      expect(localStorageMock.setItem).toHaveBeenNthCalledWith(3, '__gui__mode', 'VSAN');
      expect(localStorageMock.setItem).toHaveBeenNthCalledWith(4, '__gui__mode', 'NORMAL');
    });
  });

  describe('hook interface', () => {
    it('should return correct interface structure', () => {
      localStorageMock.getItem.mockReturnValue('NORMAL');

      const { result } = renderHook(() => useUIModeStorage());

      expect(result.current).toHaveProperty('UIMode');
      expect(result.current).toHaveProperty('updateUIMode');
      expect(typeof result.current.UIMode).toBe('string');
      expect(typeof result.current.updateUIMode).toBe('function');
    });

    it('should maintain UI mode state across multiple renders', () => {
      localStorageMock.getItem.mockReturnValue('NORMAL');

      const { result, rerender } = renderHook(() => useUIModeStorage());

      act(() => {
        result.current.updateUIMode('HCI');
      });

      rerender();

      expect(result.current.UIMode).toBe('HCI');
    });
  });
});
