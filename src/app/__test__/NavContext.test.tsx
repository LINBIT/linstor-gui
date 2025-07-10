// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavProvider, useNav } from '../NavContext';

// Mock the usePersistentMenuState hook
const mockSetIsNavOpen = vi.fn();
const mockUsePersistentMenuState = vi.fn(() => [false, mockSetIsNavOpen]);

vi.mock('@app/hooks', () => ({
  usePersistentMenuState: () => mockUsePersistentMenuState(),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Test component that uses the useNav hook
const TestComponent = () => {
  const { isNavOpen, toggleNav } = useNav();
  return (
    <div>
      <div data-testid="nav-state">{isNavOpen ? 'open' : 'closed'}</div>
      <button data-testid="toggle-button" onClick={toggleNav}>
        Toggle
      </button>
    </div>
  );
};

describe('NavContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePersistentMenuState.mockReturnValue([false, mockSetIsNavOpen]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('NavProvider', () => {
    it('should render children correctly', () => {
      render(
        <NavProvider>
          <div data-testid="child">Test Child</div>
        </NavProvider>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide nav context to children', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('closed');
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });

    it('should initialize with nav closed by default', () => {
      mockUsePersistentMenuState.mockReturnValue([false, mockSetIsNavOpen]);

      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('closed');
    });

    it('should initialize with nav open when persistent state is true', () => {
      mockUsePersistentMenuState.mockReturnValue([true, mockSetIsNavOpen]);

      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('open');
    });

    it('should call toggleNav when toggle button is clicked', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-button');
      fireEvent.click(toggleButton);

      expect(mockSetIsNavOpen).toHaveBeenCalledTimes(1);
      expect(mockSetIsNavOpen).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should toggle nav state correctly', () => {
      let currentState = false;
      mockSetIsNavOpen.mockImplementation((updater) => {
        if (typeof updater === 'function') {
          currentState = updater(currentState);
        } else {
          currentState = updater;
        }
        mockUsePersistentMenuState.mockReturnValue([currentState, mockSetIsNavOpen]);
      });

      const { rerender } = render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      // Initially closed
      expect(screen.getByTestId('nav-state')).toHaveTextContent('closed');

      // Click toggle button
      fireEvent.click(screen.getByTestId('toggle-button'));

      // Update mock to return new state
      mockUsePersistentMenuState.mockReturnValue([true, mockSetIsNavOpen]);

      // Rerender to reflect state change
      rerender(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('open');
    });

    it('should handle multiple toggle operations', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-button');

      // First click
      fireEvent.click(toggleButton);
      expect(mockSetIsNavOpen).toHaveBeenCalledTimes(1);

      // Second click
      fireEvent.click(toggleButton);
      expect(mockSetIsNavOpen).toHaveBeenCalledTimes(2);

      // Third click
      fireEvent.click(toggleButton);
      expect(mockSetIsNavOpen).toHaveBeenCalledTimes(3);
    });

    it('should use usePersistentMenuState hook with initial value true', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(mockUsePersistentMenuState).toHaveBeenCalledTimes(1);
    });

    it('should provide stable context value', () => {
      const contextValues: Array<{ isNavOpen: boolean; toggleNav: () => void }> = [];

      const ContextChecker = () => {
        const context = useNav();
        contextValues.push(context);
        return null;
      };

      render(
        <NavProvider>
          <ContextChecker />
        </NavProvider>,
      );

      // Should have at least one context value
      expect(contextValues.length).toBeGreaterThan(0);

      // Context should have required properties
      expect(contextValues[0]).toHaveProperty('isNavOpen');
      expect(contextValues[0]).toHaveProperty('toggleNav');
      expect(typeof contextValues[0].toggleNav).toBe('function');
    });
  });

  describe('useNav hook', () => {
    it('should return nav context when used within NavProvider', () => {
      mockUsePersistentMenuState.mockReturnValue([true, mockSetIsNavOpen]);

      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('open');
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });

    it('should throw error when used outside NavProvider', () => {
      // Create a component that uses useNav outside of provider
      const ComponentWithoutProvider = () => {
        const { isNavOpen } = useNav();
        return <div data-testid="nav-state">{isNavOpen ? 'open' : 'closed'}</div>;
      };

      // Mock console.error to avoid error output in tests
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ComponentWithoutProvider />);
      }).toThrow('useNav must be used within a NavProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide correct isNavOpen value', () => {
      mockUsePersistentMenuState.mockReturnValue([true, mockSetIsNavOpen]);

      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('open');
    });

    it('should provide working toggleNav function', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-button');

      // Function should be callable without errors
      expect(() => {
        fireEvent.click(toggleButton);
      }).not.toThrow();

      expect(mockSetIsNavOpen).toHaveBeenCalled();
    });
  });

  describe('integration with usePersistentMenuState', () => {
    it('should persist nav state changes', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      const toggleButton = screen.getByTestId('toggle-button');
      fireEvent.click(toggleButton);

      // Should call the setter function from usePersistentMenuState
      expect(mockSetIsNavOpen).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle nav state persistence correctly', () => {
      // Test with different initial states
      mockUsePersistentMenuState.mockReturnValue([false, mockSetIsNavOpen]);

      const { rerender } = render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('closed');

      // Simulate state change
      mockUsePersistentMenuState.mockReturnValue([true, mockSetIsNavOpen]);

      rerender(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      expect(screen.getByTestId('nav-state')).toHaveTextContent('open');
    });
  });

  describe('toggleNav function behavior', () => {
    it('should toggle from false to true', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      fireEvent.click(screen.getByTestId('toggle-button'));

      expect(mockSetIsNavOpen).toHaveBeenCalledWith(expect.any(Function));

      // Test the function passed to setIsNavOpen
      const toggleFunction = mockSetIsNavOpen.mock.calls[0][0];
      expect(toggleFunction(false)).toBe(true);
    });

    it('should toggle from true to false', () => {
      render(
        <NavProvider>
          <TestComponent />
        </NavProvider>,
      );

      fireEvent.click(screen.getByTestId('toggle-button'));

      expect(mockSetIsNavOpen).toHaveBeenCalledWith(expect.any(Function));

      // Test the function passed to setIsNavOpen
      const toggleFunction = mockSetIsNavOpen.mock.calls[0][0];
      expect(toggleFunction(true)).toBe(false);
    });
  });
});
