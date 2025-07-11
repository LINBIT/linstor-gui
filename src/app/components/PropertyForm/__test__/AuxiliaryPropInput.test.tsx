// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuxiliaryPropInput from '../AuxiliaryPropInput';

interface MockInputProps {
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  [key: string]: unknown;
}

interface MockButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
  shape?: string;
  [key: string]: unknown;
}

interface MockTextProps {
  children: React.ReactNode;
}

// Mock Antd components
vi.mock('antd', () => ({
  Input: ({ value, onChange, placeholder, ...props }: MockInputProps) => (
    <input
      data-testid="input"
      value={value || ''}
      onChange={(e) => onChange && onChange({ target: { value: e.target.value } })}
      placeholder={placeholder}
      {...props}
    />
  ),
  Button: ({ children, onClick, danger, icon, shape, ...props }: MockButtonProps) => (
    <button
      data-testid="delete-button"
      onClick={onClick}
      className={`${danger ? 'danger' : ''} ${shape ? `shape-${shape}` : ''}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
  Typography: {
    Text: ({ children }: MockTextProps) => <span data-testid="text">{children}</span>,
  },
}));

// Mock DeleteOutlined icon
vi.mock('@ant-design/icons', () => ({
  DeleteOutlined: () => <span data-testid="delete-icon">🗑️</span>,
}));

describe('AuxiliaryPropInput', () => {
  const mockInitialVal = {
    id: 'test-id-1',
    name: 'test-property',
    value: 'test-value',
  };

  const mockHandleDeleteAuxProp = vi.fn();
  const mockOnChange = vi.fn();

  const defaultProps = {
    initialVal: mockInitialVal,
    handleDeleteAuxProp: mockHandleDeleteAuxProp,
    onChange: mockOnChange,
    isFirst: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with all components', () => {
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    expect(inputs).toHaveLength(2); // name and value inputs
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('displays initial values in inputs', () => {
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const nameInput = inputs[0];
    const valueInput = inputs[1];

    expect(nameInput).toHaveValue('test-property');
    expect(valueInput).toHaveValue('test-value');
  });

  it('displays placeholders correctly', () => {
    const propsWithEmptyInitial = {
      ...defaultProps,
      initialVal: { id: 'empty-id', name: '', value: '' },
    };

    render(<AuxiliaryPropInput {...propsWithEmptyInitial} />);

    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveAttribute('placeholder', 'Please input property name');
    expect(inputs[1]).toHaveAttribute('placeholder', 'Please input property value');
  });

  it('shows header labels when isFirst is true', () => {
    const propsWithIsFirst = {
      ...defaultProps,
      isFirst: true,
    };

    render(<AuxiliaryPropInput {...propsWithIsFirst} />);

    expect(screen.getByText('Property Name')).toBeInTheDocument();
    expect(screen.getByText('Property Value')).toBeInTheDocument();
  });

  it('does not show header labels when isFirst is false', () => {
    render(<AuxiliaryPropInput {...defaultProps} />);

    expect(screen.queryByText('Property Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Property Value')).not.toBeInTheDocument();
  });

  it('calls onChange when name input changes', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const nameInput = inputs[0];

    await user.clear(nameInput);
    await user.type(nameInput, 'new-property-name');

    expect(mockOnChange).toHaveBeenCalledWith({
      id: 'test-id-1',
      name: 'new-property-name',
      value: 'test-value',
    });
  });

  it('calls onChange when value input changes', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const valueInput = inputs[1];

    await user.clear(valueInput);
    await user.type(valueInput, 'new-property-value');

    expect(mockOnChange).toHaveBeenCalledWith({
      id: 'test-id-1',
      name: 'test-property',
      value: 'new-property-value',
    });
  });

  it('calls handleDeleteAuxProp when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    expect(mockHandleDeleteAuxProp).toHaveBeenCalledWith('test-id-1');
    expect(mockHandleDeleteAuxProp).toHaveBeenCalledTimes(1);
  });

  it('updates local state when initialVal changes', () => {
    const { rerender } = render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('test-property');
    expect(inputs[1]).toHaveValue('test-value');

    // Update with new initial values
    const newInitialVal = {
      id: 'test-id-2',
      name: 'updated-property',
      value: 'updated-value',
    };

    rerender(<AuxiliaryPropInput {...defaultProps} initialVal={newInitialVal} />);

    const updatedInputs = screen.getAllByTestId('input');
    expect(updatedInputs[0]).toHaveValue('updated-property');
    expect(updatedInputs[1]).toHaveValue('updated-value');
  });

  it('handles empty initial values', () => {
    const propsWithEmptyInitial = {
      ...defaultProps,
      initialVal: { id: 'empty-id', name: '', value: '' },
    };

    render(<AuxiliaryPropInput {...propsWithEmptyInitial} />);

    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');
  });

  it('handles undefined/null initial values', () => {
    const propsWithNullInitial = {
      ...defaultProps,
      initialVal: { id: 'null-id', name: '', value: '' },
    };

    render(<AuxiliaryPropInput {...propsWithNullInitial} />);

    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');
  });

  it('applies correct styling classes to delete button', () => {
    render(<AuxiliaryPropInput {...defaultProps} />);

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toHaveClass('danger');
    expect(deleteButton).toHaveClass('shape-circle');
  });

  it('maintains input values during typing sequences', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const nameInput = inputs[0];
    const valueInput = inputs[1];

    // Type in name input
    await user.clear(nameInput);
    await user.type(nameInput, 'new-name');
    expect(nameInput).toHaveValue('new-name');

    // Type in value input
    await user.clear(valueInput);
    await user.type(valueInput, 'new-value');
    expect(valueInput).toHaveValue('new-value');

    // Verify both inputs maintain their values
    expect(nameInput).toHaveValue('new-name');
    expect(valueInput).toHaveValue('new-value');
  });

  it('calls onChange with correct parameters during sequential changes', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const nameInput = inputs[0];
    const valueInput = inputs[1];

    // Clear and type in name input
    await user.clear(nameInput);
    await user.type(nameInput, 'a');

    // Should call onChange with updated name
    expect(mockOnChange).toHaveBeenCalledWith({
      id: 'test-id-1',
      name: 'a',
      value: 'test-value',
    });

    // Clear and type in value input
    await user.clear(valueInput);
    await user.type(valueInput, 'b');

    // Should call onChange with updated value
    expect(mockOnChange).toHaveBeenCalledWith({
      id: 'test-id-1',
      name: 'a',
      value: 'b',
    });
  });

  it('handles rapid input changes correctly', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const nameInput = inputs[0];

    // Simulate rapid typing
    await user.clear(nameInput);
    await user.type(nameInput, 'rapid');

    // Should have called onChange multiple times (once for each character)
    expect(mockOnChange).toHaveBeenCalled();

    // Last call should have the complete text
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({
      id: 'test-id-1',
      name: 'rapid',
      value: 'test-value',
    });
  });

  it('preserves ID throughout all operations', async () => {
    const user = userEvent.setup();
    render(<AuxiliaryPropInput {...defaultProps} />);

    const inputs = screen.getAllByTestId('input');
    const nameInput = inputs[0];
    const valueInput = inputs[1];

    // Change name
    await user.clear(nameInput);
    await user.type(nameInput, 'new-name');

    // Change value
    await user.clear(valueInput);
    await user.type(valueInput, 'new-value');

    // All onChange calls should preserve the original ID
    mockOnChange.mock.calls.forEach((call) => {
      expect(call[0].id).toBe('test-id-1');
    });
  });
});
