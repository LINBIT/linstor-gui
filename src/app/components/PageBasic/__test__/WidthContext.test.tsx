// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WidthProvider, useWidth } from '../WidthContext';

// Mock the NavContext
const mockToggleNav = vi.fn();
const mockUseNav = vi.fn(() => ({
  isNavOpen: false,
  toggleNav: mockToggleNav,
}));

vi.mock('@app/NavContext', () => ({
  useNav: () => mockUseNav(),
}));

// Test component that uses the useWidth hook
const TestComponent = () => {
  const { width } = useWidth();
  return <div data-testid="width-display">{width}</div>;
};

describe('WidthContext', () => {
  let mockContentElement: { clientWidth: number };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock DOM element with clientWidth
    mockContentElement = {
      clientWidth: 800,
    };

    // Mock querySelector to return our mock element
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '.content') {
        return mockContentElement as unknown as HTMLElement;
      }
      return null;
    });

    // Mock addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WidthProvider', () => {
    it('should render children correctly', () => {
      render(
        <WidthProvider>
          <div data-testid="child">Test Child</div>
        </WidthProvider>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide width context to children', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      expect(screen.getByTestId('width-display')).toHaveTextContent('800');
    });

    it('should initialize width from .content element', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      expect(document.querySelector).toHaveBeenCalledWith('.content');
      expect(screen.getByTestId('width-display')).toHaveTextContent('800');
    });

    it('should set width to 0 when .content element is not found', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      expect(screen.getByTestId('width-display')).toHaveTextContent('0');
    });

    it('should add resize event listener on mount', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should remove resize event listener on unmount', () => {
      const { unmount } = render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should update width when window is resized', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      // Initial width should be 800
      expect(screen.getByTestId('width-display')).toHaveTextContent('800');

      // Change the mock element's clientWidth
      mockContentElement.clientWidth = 1000;

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Width should be updated
      expect(screen.getByTestId('width-display')).toHaveTextContent('1000');
    });

    it('should update width when nav state changes', () => {
      // Start with nav closed
      mockUseNav.mockReturnValue({
        isNavOpen: false,
        toggleNav: mockToggleNav,
      });

      const { rerender } = render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      // Initial width should be 800
      expect(screen.getByTestId('width-display')).toHaveTextContent('800');

      // Change mock to nav open and update content width
      mockUseNav.mockReturnValue({
        isNavOpen: true,
        toggleNav: mockToggleNav,
      });
      mockContentElement.clientWidth = 600;

      // Rerender with nav open
      rerender(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      // Width should be updated
      expect(screen.getByTestId('width-display')).toHaveTextContent('600');
    });

    it('should handle multiple content width changes', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      // Initial width
      expect(screen.getByTestId('width-display')).toHaveTextContent('800');

      // First resize
      mockContentElement.clientWidth = 1200;
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(screen.getByTestId('width-display')).toHaveTextContent('1200');

      // Second resize
      mockContentElement.clientWidth = 500;
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(screen.getByTestId('width-display')).toHaveTextContent('500');
    });

    it('should handle the case where content element becomes unavailable', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      // Initial width should be 800
      expect(screen.getByTestId('width-display')).toHaveTextContent('800');

      // Mock querySelector to return null (element not found)
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Width should remain at previous value since element is not found
      expect(screen.getByTestId('width-display')).toHaveTextContent('800');
    });
  });

  describe('useWidth hook', () => {
    it('should provide width value from context', () => {
      render(
        <WidthProvider>
          <TestComponent />
        </WidthProvider>,
      );

      expect(screen.getByTestId('width-display')).toHaveTextContent('800');
    });

    it('should return 0 when used outside of WidthProvider', () => {
      // Test component without WidthProvider
      const ComponentWithoutProvider = () => {
        const { width } = useWidth();
        return <div data-testid="width-display">{width}</div>;
      };

      render(<ComponentWithoutProvider />);

      expect(screen.getByTestId('width-display')).toHaveTextContent('0');
    });
  });
});
