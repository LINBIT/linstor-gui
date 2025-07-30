// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { useWidth, WidthContext, WidthContextProps } from '../useWidth';

// Mock Provider component for testing
const MockWidthProvider: React.FC<{ children: React.ReactNode; value?: WidthContextProps }> = ({ children, value }) => {
  const defaultValue: WidthContextProps = { width: 0 };

  return <WidthContext.Provider value={value || defaultValue}>{children}</WidthContext.Provider>;
};

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const { width } = useWidth();

  return (
    <div>
      <div data-testid="width-value">{String(width)}</div>
      <div data-testid="width-type">{typeof width}</div>
    </div>
  );
};

describe('useWidth', () => {
  describe('basic functionality', () => {
    it('should return default width value when no provider value is set', () => {
      render(
        <MockWidthProvider>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('0');
      expect(screen.getByTestId('width-type')).toHaveTextContent('number');
    });

    it('should return custom width value when provider value is set', () => {
      const customValue: WidthContextProps = { width: 1024 };

      render(
        <MockWidthProvider value={customValue}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('1024');
      expect(screen.getByTestId('width-type')).toHaveTextContent('number');
    });

    it('should work without explicit provider (using default context)', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('width-value')).toHaveTextContent('0');
      expect(screen.getByTestId('width-type')).toHaveTextContent('number');
    });
  });

  describe('different width values', () => {
    it('should handle small width values', () => {
      const smallWidth: WidthContextProps = { width: 320 };

      render(
        <MockWidthProvider value={smallWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('320');
    });

    it('should handle large width values', () => {
      const largeWidth: WidthContextProps = { width: 2560 };

      render(
        <MockWidthProvider value={largeWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('2560');
    });

    it('should handle decimal width values', () => {
      const decimalWidth: WidthContextProps = { width: 1366.5 };

      render(
        <MockWidthProvider value={decimalWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('1366.5');
    });

    it('should handle negative width values', () => {
      const negativeWidth: WidthContextProps = { width: -100 };

      render(
        <MockWidthProvider value={negativeWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('-100');
    });

    it('should handle zero width value', () => {
      const zeroWidth: WidthContextProps = { width: 0 };

      render(
        <MockWidthProvider value={zeroWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('0');
    });
  });

  describe('hook behavior', () => {
    it('should return the same context value across multiple calls', () => {
      let capturedContext1: WidthContextProps | undefined;
      let capturedContext2: WidthContextProps | undefined;

      const CaptureComponent: React.FC = () => {
        capturedContext1 = useWidth();
        capturedContext2 = useWidth();
        return <div>Capture</div>;
      };

      const customValue: WidthContextProps = { width: 800 };

      render(
        <MockWidthProvider value={customValue}>
          <CaptureComponent />
        </MockWidthProvider>,
      );

      expect(capturedContext1).toBeDefined();
      expect(capturedContext2).toBeDefined();
      expect(capturedContext1).toBe(capturedContext2);
      expect(capturedContext1!.width).toBe(capturedContext2!.width);
    });

    it('should maintain consistent value across multiple components', () => {
      const Component1: React.FC = () => {
        const { width } = useWidth();
        return <div data-testid="width-1">{width}</div>;
      };

      const Component2: React.FC = () => {
        const { width } = useWidth();
        return <div data-testid="width-2">{width}</div>;
      };

      const customValue: WidthContextProps = { width: 1200 };

      render(
        <MockWidthProvider value={customValue}>
          <Component1 />
          <Component2 />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-1')).toHaveTextContent('1200');
      expect(screen.getByTestId('width-2')).toHaveTextContent('1200');
    });
  });

  describe('context updates', () => {
    it('should reflect updated context values', async () => {
      const TestWrapper: React.FC = () => {
        const [width, setWidth] = React.useState(640);

        return (
          <>
            <button data-testid="update-width" onClick={() => setWidth(1024)}>
              Update Width
            </button>
            <WidthContext.Provider value={{ width }}>
              <TestComponent />
            </WidthContext.Provider>
          </>
        );
      };

      render(<TestWrapper />);

      // Initial width
      expect(screen.getByTestId('width-value')).toHaveTextContent('640');

      // Update width with act wrapper
      const updateButton = screen.getByTestId('update-width');
      await act(async () => {
        updateButton.click();
      });

      expect(screen.getByTestId('width-value')).toHaveTextContent('1024');
    });
  });

  describe('type safety', () => {
    it('should provide correctly typed context properties', () => {
      let capturedContext: WidthContextProps | undefined;

      const TypeTestComponent: React.FC = () => {
        capturedContext = useWidth();
        return <div>Type Test</div>;
      };

      render(
        <MockWidthProvider>
          <TypeTestComponent />
        </MockWidthProvider>,
      );

      expect(capturedContext).toBeDefined();
      expect(typeof capturedContext!.width).toBe('number');
      expect(capturedContext!.width).toBeGreaterThanOrEqual(0);
    });

    it('should handle width property as number type only', () => {
      const numericWidth: WidthContextProps = { width: 1920 };

      render(
        <MockWidthProvider value={numericWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      const widthElement = screen.getByTestId('width-value');
      const displayedWidth = parseInt(widthElement.textContent || '0');

      expect(typeof displayedWidth).toBe('number');
      expect(displayedWidth).toBe(1920);
    });
  });

  describe('edge cases', () => {
    it('should handle very large width values', () => {
      const veryLargeWidth: WidthContextProps = { width: Number.MAX_SAFE_INTEGER };

      render(
        <MockWidthProvider value={veryLargeWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent(Number.MAX_SAFE_INTEGER.toString());
    });

    it('should handle infinity values', () => {
      const infinityWidth: WidthContextProps = { width: Infinity };

      render(
        <MockWidthProvider value={infinityWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('Infinity');
    });

    it('should handle NaN values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const nanWidth: WidthContextProps = { width: NaN };

      render(
        <MockWidthProvider value={nanWidth}>
          <TestComponent />
        </MockWidthProvider>,
      );

      expect(screen.getByTestId('width-value')).toHaveTextContent('NaN');

      consoleWarnSpy.mockRestore();
    });
  });
});
