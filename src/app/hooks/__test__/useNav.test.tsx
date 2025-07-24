// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { useNav, NavContext, NavContextProps } from '../useNav';

// Mock Provider component for testing
const MockNavProvider: React.FC<{ children: React.ReactNode; value?: NavContextProps }> = ({ children, value }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const defaultValue: NavContextProps = {
    isNavOpen,
    toggleNav: () => setIsNavOpen(!isNavOpen),
  };

  return <NavContext.Provider value={value || defaultValue}>{children}</NavContext.Provider>;
};

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const { isNavOpen, toggleNav } = useNav();

  return (
    <div>
      <div data-testid="nav-status">{isNavOpen ? 'open' : 'closed'}</div>
      <button data-testid="toggle-button" onClick={toggleNav}>
        Toggle
      </button>
    </div>
  );
};

// Test component without provider
const TestComponentWithoutProvider: React.FC = () => {
  useNav();
  return <div>Should not render</div>;
};

describe('useNav', () => {
  describe('context functionality', () => {
    it('should provide navigation state and toggle function', () => {
      render(
        <MockNavProvider>
          <TestComponent />
        </MockNavProvider>,
      );

      expect(screen.getByTestId('nav-status')).toHaveTextContent('closed');
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });

    it('should toggle navigation state when toggleNav is called', () => {
      render(
        <MockNavProvider>
          <TestComponent />
        </MockNavProvider>,
      );

      const statusElement = screen.getByTestId('nav-status');
      const toggleButton = screen.getByTestId('toggle-button');

      // Initial state should be closed
      expect(statusElement).toHaveTextContent('closed');

      // Toggle to open
      fireEvent.click(toggleButton);
      expect(statusElement).toHaveTextContent('open');

      // Toggle back to closed
      fireEvent.click(toggleButton);
      expect(statusElement).toHaveTextContent('closed');
    });

    it('should work with custom context value', () => {
      const mockToggle = vi.fn();
      const customValue: NavContextProps = {
        isNavOpen: true,
        toggleNav: mockToggle,
      };

      render(
        <MockNavProvider value={customValue}>
          <TestComponent />
        </MockNavProvider>,
      );

      const statusElement = screen.getByTestId('nav-status');
      const toggleButton = screen.getByTestId('toggle-button');

      expect(statusElement).toHaveTextContent('open');

      fireEvent.click(toggleButton);
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should throw error when used outside of NavProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useNav must be used within a NavProvider');

      consoleSpy.mockRestore();
    });

    it('should throw error with correct message when context is undefined', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <NavContext.Provider value={undefined}>
            <TestComponent />
          </NavContext.Provider>,
        );
      }).toThrow('useNav must be used within a NavProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('hook behavior', () => {
    it('should return the same context value across multiple calls', () => {
      let capturedContext1: NavContextProps | undefined;
      let capturedContext2: NavContextProps | undefined;

      const CaptureComponent: React.FC = () => {
        capturedContext1 = useNav();
        capturedContext2 = useNav();
        return <div>Capture</div>;
      };

      render(
        <MockNavProvider>
          <CaptureComponent />
        </MockNavProvider>,
      );

      expect(capturedContext1).toBeDefined();
      expect(capturedContext2).toBeDefined();
      expect(capturedContext1).toBe(capturedContext2);
      expect(capturedContext1!.isNavOpen).toBe(capturedContext2!.isNavOpen);
      expect(capturedContext1!.toggleNav).toBe(capturedContext2!.toggleNav);
    });

    it('should maintain state across multiple components using the hook', () => {
      const Component1: React.FC = () => {
        const { isNavOpen, toggleNav } = useNav();
        return (
          <div>
            <div data-testid="status-1">{isNavOpen ? 'open' : 'closed'}</div>
            <button data-testid="toggle-1" onClick={toggleNav}>
              Toggle 1
            </button>
          </div>
        );
      };

      const Component2: React.FC = () => {
        const { isNavOpen } = useNav();
        return <div data-testid="status-2">{isNavOpen ? 'open' : 'closed'}</div>;
      };

      render(
        <MockNavProvider>
          <Component1 />
          <Component2 />
        </MockNavProvider>,
      );

      const status1 = screen.getByTestId('status-1');
      const status2 = screen.getByTestId('status-2');
      const toggle1 = screen.getByTestId('toggle-1');

      // Both should show the same initial state
      expect(status1).toHaveTextContent('closed');
      expect(status2).toHaveTextContent('closed');

      // Toggle from component 1 should affect both
      fireEvent.click(toggle1);
      expect(status1).toHaveTextContent('open');
      expect(status2).toHaveTextContent('open');
    });
  });

  describe('type safety', () => {
    it('should provide correctly typed context properties', () => {
      let capturedContext: NavContextProps | undefined;

      const TypeTestComponent: React.FC = () => {
        capturedContext = useNav();
        return <div>Type Test</div>;
      };

      render(
        <MockNavProvider>
          <TypeTestComponent />
        </MockNavProvider>,
      );

      expect(capturedContext).toBeDefined();
      expect(typeof capturedContext!.isNavOpen).toBe('boolean');
      expect(typeof capturedContext!.toggleNav).toBe('function');
    });
  });
});
