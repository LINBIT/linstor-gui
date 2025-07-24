import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import usePersistentMenuState from '../usePersistentMenuState';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('usePersistentMenuState', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    sessionStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.setItem.mockImplementation(() => {});
  });

  describe('initialization', () => {
    it('should use initial value when sessionStorage is empty', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePersistentMenuState(true));
      const [isOpen] = result.current;

      expect(isOpen).toBe(true);
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('menuOpen');
    });

    it('should use initial value false when sessionStorage is empty', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePersistentMenuState(false));
      const [isOpen] = result.current;

      expect(isOpen).toBe(false);
    });

    it('should use stored value true from sessionStorage', () => {
      sessionStorageMock.getItem.mockReturnValue('true');

      const { result } = renderHook(() => usePersistentMenuState(false));
      const [isOpen] = result.current;

      expect(isOpen).toBe(true);
    });

    it('should use stored value false from sessionStorage', () => {
      sessionStorageMock.getItem.mockReturnValue('false');

      const { result } = renderHook(() => usePersistentMenuState(true));
      const [isOpen] = result.current;

      expect(isOpen).toBe(false);
    });

    it('should handle invalid stored values gracefully', () => {
      sessionStorageMock.getItem.mockReturnValue('invalid');

      const { result } = renderHook(() => usePersistentMenuState(true));
      const [isOpen] = result.current;

      expect(isOpen).toBe(false); // 'invalid' !== 'true', so should be false
    });
  });

  describe('state updates', () => {
    it('should update state and save to sessionStorage', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePersistentMenuState(false));
      const [, setIsOpen] = result.current;

      act(() => {
        setIsOpen(true);
      });

      expect(result.current[0]).toBe(true);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('menuOpen', 'true');
    });

    it('should update state from true to false', () => {
      sessionStorageMock.getItem.mockReturnValue('true');

      const { result } = renderHook(() => usePersistentMenuState(false));
      const [, setIsOpen] = result.current;

      act(() => {
        setIsOpen(false);
      });

      expect(result.current[0]).toBe(false);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('menuOpen', 'false');
    });

    it('should work with functional state updates', () => {
      sessionStorageMock.getItem.mockReturnValue('false');

      const { result } = renderHook(() => usePersistentMenuState(true));
      const [, setIsOpen] = result.current;

      act(() => {
        setIsOpen((prev) => !prev);
      });

      expect(result.current[0]).toBe(true);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('menuOpen', 'true');
    });
  });

  describe('sessionStorage persistence', () => {
    it('should save to sessionStorage on initial render', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      renderHook(() => usePersistentMenuState(true));

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('menuOpen', 'true');
    });

    it('should save to sessionStorage on every state change', () => {
      sessionStorageMock.getItem.mockReturnValue('false');

      const { result } = renderHook(() => usePersistentMenuState(true));
      const [, setIsOpen] = result.current;

      // Clear the initial call
      sessionStorageMock.setItem.mockClear();

      act(() => {
        setIsOpen(true);
      });

      act(() => {
        setIsOpen(false);
      });

      expect(sessionStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(sessionStorageMock.setItem).toHaveBeenNthCalledWith(1, 'menuOpen', 'true');
      expect(sessionStorageMock.setItem).toHaveBeenNthCalledWith(2, 'menuOpen', 'false');
    });
  });

  describe('hook interface', () => {
    it('should return correct tuple structure', () => {
      const { result } = renderHook(() => usePersistentMenuState(false));

      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('boolean');
      expect(typeof result.current[1]).toBe('function');
    });

    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => usePersistentMenuState(false));
      const [, setIsOpen] = result.current;

      act(() => {
        setIsOpen(true);
      });

      rerender();

      expect(result.current[0]).toBe(true);
    });

    it('should work with different initial values on different instances', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      const { result: result1 } = renderHook(() => usePersistentMenuState(true));
      const { result: result2 } = renderHook(() => usePersistentMenuState(false));

      // Each should use their initial values when no stored value exists
      expect(result1.current[0]).toBe(true);
      expect(result2.current[0]).toBe(false); // Uses its own initial value
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid state changes', () => {
      sessionStorageMock.getItem.mockReturnValue('false');

      const { result } = renderHook(() => usePersistentMenuState(false));
      const [, setState] = result.current;

      // Rapidly change state multiple times
      act(() => {
        setState(true);
      });

      act(() => {
        setState(false);
      });

      act(() => {
        setState(true);
      });

      // Should have correct final state
      expect(result.current[0]).toBe(true);
      // Should have called setItem multiple times (including initial render)
      expect(sessionStorageMock.setItem).toHaveBeenCalled();
    });
  });
});
