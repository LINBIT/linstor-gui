// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PropertySelector from '../PropertySelector';

interface MockSelectProps {
  options?: Array<{ value: string; label: string }>;
  onChange?: (value: string | undefined) => void;
  value?: string;
  placeholder?: string;
  allowClear?: boolean;
  [key: string]: unknown;
}

interface MockTooltipProps {
  children: React.ReactNode;
  title?: string;
}

interface MockButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: string;
  [key: string]: unknown;
}

// Mock Antd components
vi.mock('antd', () => ({
  Select: ({ options, onChange, value, placeholder, allowClear, showSearch, optionRender }: MockSelectProps) => (
    <div data-testid="select-component">
      <select
        data-testid="select"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        data-show-search={showSearch ? 'true' : 'false'}
        data-option-render={optionRender ? 'custom' : 'default'}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options?.map((option: { value: string; label: string }, index: number) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {allowClear && value && (
        <button data-testid="clear-button" onClick={() => onChange && onChange(undefined)}>
          Clear
        </button>
      )}
    </div>
  ),
  Tooltip: ({ children, title }: MockTooltipProps) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, className, type, ...props }: MockButtonProps) => (
    <button
      data-testid={`button-${className || type || 'default'}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('PropertySelector', () => {
  const mockOptions = [
    {
      value: 'property1',
      label: 'Property 1',
      description: 'Description for property 1',
    },
    {
      value: 'property2',
      label: 'Property 2',
      description: 'Description for property 2',
    },
    {
      value: 'property3',
      label: 'Property 3',
      description: 'Description for property 3',
    },
  ];

  const mockHandleAddProperty = vi.fn();
  const mockHandleAddAuxProp = vi.fn();
  const mockHandleDeleteAllAuxProp = vi.fn();

  const defaultProps = {
    options: mockOptions,
    handleAddProperty: mockHandleAddProperty,
    handleAddAuxProp: mockHandleAddAuxProp,
    handleDeleteAllAuxProp: mockHandleDeleteAllAuxProp,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with all components', () => {
    render(<PropertySelector {...defaultProps} />);

    expect(screen.getByTestId('select-component')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Add Auxiliary Property')).toBeInTheDocument();
  });

  it('displays placeholder text in select', () => {
    render(<PropertySelector {...defaultProps} />);

    const select = screen.getByTestId('select');
    expect(select).toHaveValue('');

    // Check if placeholder option exists
    const placeholderOption = screen.getByText('Select a property');
    expect(placeholderOption).toBeInTheDocument();
  });

  it('renders all options in select', () => {
    render(<PropertySelector {...defaultProps} />);

    mockOptions.forEach((option) => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('updates selected value when option is chosen', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const select = screen.getByTestId('select');

    await user.selectOptions(select, 'property1');

    expect(select).toHaveValue('property1');
  });

  it('enables Add button when option is selected', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const addButton = screen.getByText('Add');
    const select = screen.getByTestId('select');

    // Initially disabled
    expect(addButton).toBeDisabled();

    // Select an option
    await user.selectOptions(select, 'property1');

    // Should be enabled now
    expect(addButton).toBeEnabled();
  });

  it('calls handleAddProperty when Add button is clicked', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const addButton = screen.getByText('Add');
    const select = screen.getByTestId('select');

    // Select an option
    await user.selectOptions(select, 'property2');

    // Click Add button
    await user.click(addButton);

    expect(mockHandleAddProperty).toHaveBeenCalledWith('property2');
    expect(mockHandleAddProperty).toHaveBeenCalledTimes(1);
  });

  it('resets selected value after adding property', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const addButton = screen.getByText('Add');
    const select = screen.getByTestId('select');

    // Select an option
    await user.selectOptions(select, 'property1');
    expect(select).toHaveValue('property1');

    // Click Add button
    await user.click(addButton);

    // Value should be reset
    expect(select).toHaveValue('');
  });

  it('does not call handleAddProperty when Add button is clicked without selection', async () => {
    render(<PropertySelector {...defaultProps} />);

    const addButton = screen.getByText('Add');

    // Try to click Add button without selection (should be disabled)
    expect(addButton).toBeDisabled();

    expect(mockHandleAddProperty).not.toHaveBeenCalled();
  });

  it('calls handleAddAuxProp when Add Auxiliary Property button is clicked', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const auxButton = screen.getByText('Add Auxiliary Property');

    await user.click(auxButton);

    expect(mockHandleAddAuxProp).toHaveBeenCalledTimes(1);
  });

  it('handles clear functionality', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const select = screen.getByTestId('select');

    // Select an option
    await user.selectOptions(select, 'property1');
    expect(select).toHaveValue('property1');

    // Clear the selection
    const clearButton = screen.getByTestId('clear-button');
    await user.click(clearButton);

    expect(select).toHaveValue('');
  });

  it('handles empty options array', () => {
    const propsWithEmptyOptions = {
      ...defaultProps,
      options: [],
    };

    render(<PropertySelector {...propsWithEmptyOptions} />);

    const select = screen.getByTestId('select');
    expect(select).toBeInTheDocument();

    // Should only have placeholder option
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1); // Only placeholder
  });

  it('handles options without description', () => {
    const optionsWithoutDescription = [
      {
        value: 'prop1',
        label: 'Property 1',
      },
      {
        value: 'prop2',
        label: 'Property 2',
        description: undefined,
      },
    ];

    const props = {
      ...defaultProps,
      options: optionsWithoutDescription,
    };

    render(<PropertySelector {...props} />);

    expect(screen.getByText('Property 1')).toBeInTheDocument();
    expect(screen.getByText('Property 2')).toBeInTheDocument();
  });

  it('maintains button state correctly during interactions', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const addButton = screen.getByText('Add');
    const select = screen.getByTestId('select');

    // Initially disabled
    expect(addButton).toBeDisabled();

    // Select option - button should be enabled
    await user.selectOptions(select, 'property1');
    expect(addButton).toBeEnabled();

    // Clear selection - button should be disabled again
    const clearButton = screen.getByTestId('clear-button');
    await user.click(clearButton);
    expect(addButton).toBeDisabled();

    // Select again - button should be enabled
    await user.selectOptions(select, 'property2');
    expect(addButton).toBeEnabled();

    // Add property - button should be disabled after reset
    await user.click(addButton);
    expect(addButton).toBeDisabled();
  });

  it('handles multiple interactions correctly', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const addButton = screen.getByText('Add');
    const auxButton = screen.getByText('Add Auxiliary Property');
    const select = screen.getByTestId('select');

    // Test multiple property additions
    await user.selectOptions(select, 'property1');
    await user.click(addButton);
    expect(mockHandleAddProperty).toHaveBeenCalledWith('property1');

    await user.selectOptions(select, 'property2');
    await user.click(addButton);
    expect(mockHandleAddProperty).toHaveBeenCalledWith('property2');

    // Test aux property addition
    await user.click(auxButton);
    expect(mockHandleAddAuxProp).toHaveBeenCalledTimes(1);

    // Verify call counts
    expect(mockHandleAddProperty).toHaveBeenCalledTimes(2);
    expect(mockHandleAddAuxProp).toHaveBeenCalledTimes(1);
  });

  it('does not reset when adding auxiliary property', async () => {
    const user = userEvent.setup();
    render(<PropertySelector {...defaultProps} />);

    const auxButton = screen.getByText('Add Auxiliary Property');
    const select = screen.getByTestId('select');

    // Select an option
    await user.selectOptions(select, 'property1');
    expect(select).toHaveValue('property1');

    // Click auxiliary property button
    await user.click(auxButton);

    // Value should remain unchanged
    expect(select).toHaveValue('property1');
    expect(mockHandleAddAuxProp).toHaveBeenCalledTimes(1);
  });
});
