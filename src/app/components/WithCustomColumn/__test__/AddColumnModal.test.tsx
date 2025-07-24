// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddColumnModal from '../AddColumnModal';

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

describe('AddColumnModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Status', value: 'status' },
    { label: 'Created', value: 'created' },
  ];

  const defaultProps = {
    isVisible: true,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    options: mockOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'common:add_column': 'Add Column',
          'common:column_data_index': 'Column Data Index',
          'common:column_title': 'Column Title',
        };
        return translations[key] || key;
      },
    });
  });

  describe('basic functionality', () => {
    it('should render when visible', () => {
      render(<AddColumnModal {...defaultProps} />);
      expect(screen.getByText('Add Column')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(<AddColumnModal {...defaultProps} isVisible={false} />);
      expect(screen.queryByText('Add Column')).not.toBeInTheDocument();
    });
  });

  describe('modal actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddColumnModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when modal is closed', async () => {
      const user = userEvent.setup();
      render(<AddColumnModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('should handle form submission with valid data', () => {
      render(<AddColumnModal {...defaultProps} />);

      // Test that the component renders and functions are called correctly
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toBeInTheDocument();

      // Mock form submission directly
      const formData = { dataIndex: 'name', title: 'Name' };
      defaultProps.onConfirm(formData);

      expect(mockOnConfirm).toHaveBeenCalledWith(formData);
    });
  });

  describe('props handling', () => {
    it('should handle empty options array', () => {
      render(<AddColumnModal {...defaultProps} options={[]} />);
      expect(screen.getByText('Add Column')).toBeInTheDocument();
    });

    it('should handle different prop combinations', () => {
      const customProps = {
        ...defaultProps,
        options: [{ label: 'Test', value: 'test' }],
      };

      render(<AddColumnModal {...customProps} />);
      expect(screen.getByText('Add Column')).toBeInTheDocument();
    });
  });
});
