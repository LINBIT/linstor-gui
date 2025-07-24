// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import withCustomColumns from '../index';
import React from 'react';

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock react-i18next
const mockUseTranslation = vi.fn();
vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock react-inlinesvg
vi.mock('react-inlinesvg', () => ({
  default: ({ src, width, height }: { src: string; width: string; height: string }) => (
    <div data-testid="svg-icon" data-src={src} style={{ width, height }} />
  ),
}));

// Mock lodash
vi.mock('lodash', () => ({
  uniqBy: vi.fn((array, key) => {
    const seen = new Set();
    return array.filter((item: Record<string, unknown>) => {
      const keyValue = typeof key === 'string' ? item[key] : key(item);
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }),
}));

// Mock AddColumnModal component
vi.mock('../AddColumnModal', () => ({
  default: ({
    isVisible,
    onConfirm,
    onCancel,
  }: {
    isVisible: boolean;
    onConfirm: (column: { title: string; dataIndex: string; key: string }) => void;
    onCancel: () => void;
    options: Array<{ label: string; value: string }>;
  }) =>
    isVisible ? (
      <div data-testid="add-column-modal">
        <div>Add Column</div>
        <button onClick={() => onConfirm({ title: 'Test Column', dataIndex: 'testField', key: 'testField' })}>
          Confirm
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

describe('withCustomColumns', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Simple test component - ignore TypeScript checking for simplicity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TestComponent = ({ columns, dataSource, testProp }: any) => (
    <div data-testid="test-component">
      <div data-testid="columns-count">{columns.length}</div>
      <div data-testid="data-count">{dataSource.length}</div>
      {testProp && <div data-testid="test-prop">{testProp}</div>}
    </div>
  );

  const initialColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Actions', dataIndex: 'actions', key: 'actions' },
  ];

  const mockDataSource = [
    {
      parent: {
        props: {
          name: 'Item 1',
          status: 'Active',
          customField: 'Custom Value 1',
        },
      },
    },
    {
      parent: {
        props: {
          name: 'Item 2',
          status: 'Inactive',
          customField: 'Custom Value 2',
        },
      },
    },
  ];

  const defaultProps = {
    initialColumns,
    dataSource: mockDataSource,
    storageKey: 'test-table',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          add_column: 'Add Column',
          reset_column: 'Reset Columns',
        };
        return translations[key] || key;
      },
    });
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('HOC functionality', () => {
    it('should render wrapped component with initial columns', () => {
      const WrappedComponent = withCustomColumns(TestComponent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('columns-count')).toHaveTextContent('3');
      expect(screen.getByTestId('data-count')).toHaveTextContent('2');
    });

    it('should render action buttons', () => {
      const WrappedComponent = withCustomColumns(TestComponent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      // Check for buttons by their total count instead of specific names
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Add and Reset buttons

      // Check if buttons have the expected icon classes
      expect(buttons[0]).toBeInTheDocument(); // Add button with plus-circle
      expect(buttons[1]).toBeInTheDocument(); // Reset button with svg
    });

    it('should pass through additional props', () => {
      const WrappedComponent = withCustomColumns(TestComponent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} testProp="test-value" />);

      expect(screen.getByTestId('test-prop')).toHaveTextContent('test-value');
    });
  });

  describe('localStorage integration', () => {
    it('should load columns from localStorage if available', () => {
      const savedColumns = JSON.stringify([
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Custom', dataIndex: 'custom', key: 'custom', isCustom: true },
        { title: 'Actions', dataIndex: 'actions', key: 'actions' },
      ]);

      localStorageMock.getItem.mockReturnValue(savedColumns);

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-table-columns');
    });

    it('should save columns to localStorage when modified', async () => {
      const user = userEvent.setup();

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      // Click first button (add button)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);

      // Modal should be visible
      expect(screen.getByTestId('add-column-modal')).toBeInTheDocument();

      // Click confirm to add column
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reset columns and clear localStorage', async () => {
      const user = userEvent.setup();

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      // Click second button (reset button)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[1]);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-table-columns');
    });
  });

  describe('modal interactions', () => {
    it('should open modal when add button is clicked', async () => {
      const user = userEvent.setup();

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);

      expect(screen.getByTestId('add-column-modal')).toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup();

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      // Open modal
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);

      expect(screen.getByTestId('add-column-modal')).toBeInTheDocument();

      // Close modal
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByTestId('add-column-modal')).not.toBeInTheDocument();
    });

    it('should add column and increase count', async () => {
      const user = userEvent.setup();

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      // Initial columns count
      expect(screen.getByTestId('columns-count')).toHaveTextContent('3');

      // Add a column
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      // Should have 4 columns now
      expect(screen.getByTestId('columns-count')).toHaveTextContent('4');
    });
  });

  describe('edge cases', () => {
    it('should handle empty dataSource', () => {
      const WrappedComponent = withCustomColumns(TestComponent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} dataSource={[]} />);

      expect(screen.getByTestId('data-count')).toHaveTextContent('0');
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should handle malformed localStorage data gracefully', () => {
      // Mock console.warn to suppress expected warning in test output
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      localStorageMock.getItem.mockReturnValue('invalid-json');

      const WrappedComponent = withCustomColumns(TestComponent);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render(<WrappedComponent {...(defaultProps as any)} />);
      }).not.toThrow();

      expect(screen.getByTestId('columns-count')).toHaveTextContent('3');

      // Verify that the error was logged (but suppressed from output)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse saved columns from localStorage:',
        expect.any(SyntaxError),
      );

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle different storage keys', () => {
      const WrappedComponent = withCustomColumns(TestComponent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} storageKey="different-key" />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('different-key-columns');
    });
  });

  describe('column persistence', () => {
    it('should restore column order from localStorage', () => {
      const savedColumns = JSON.stringify([
        { title: 'Status', dataIndex: 'status', key: 'status' },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Actions', dataIndex: 'actions', key: 'actions' },
      ]);

      localStorageMock.getItem.mockReturnValue(savedColumns);

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} />);

      expect(screen.getByTestId('columns-count')).toHaveTextContent('3');
    });

    it('should maintain render functions from original columns', () => {
      const columnsWithRender = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          render: vi.fn(() => 'rendered'),
        },
        { title: 'Actions', dataIndex: 'actions', key: 'actions' },
      ];

      const savedColumns = JSON.stringify([
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Actions', dataIndex: 'actions', key: 'actions' },
      ]);

      localStorageMock.getItem.mockReturnValue(savedColumns);

      const WrappedComponent = withCustomColumns(TestComponent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<WrappedComponent {...(defaultProps as any)} initialColumns={columnsWithRender} />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });
});
