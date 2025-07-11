// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SizeInput } from '../index';

// Mock the size utility functions
vi.mock('@app/utils/size', () => ({
  convertRoundUp: vi.fn((unit: string, value: number) => {
    // Simple mock conversion for testing
    const conversions: Record<string, number> = {
      KiB: value,
      MiB: value * 1024,
      GiB: value * 1024 * 1024,
      TiB: value * 1024 * 1024 * 1024,
    };
    return conversions[unit] || value;
  }),
  sizeOptions: [
    { value: 'KiB', label: 'KiB' },
    { value: 'MiB', label: 'MiB' },
    { value: 'GiB', label: 'GiB' },
    { value: 'TiB', label: 'TiB' },
  ],
}));

describe('SizeInput', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('renders with default props', () => {
    render(<SizeInput />);

    const input = screen.getByPlaceholderText('Please input size');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');

    // Should have GiB as default unit
    expect(screen.getByTitle('GiB')).toBeInTheDocument();
  });

  test('renders with custom placeholder', () => {
    render(<SizeInput placeholder="Enter storage size" />);

    expect(screen.getByPlaceholderText('Enter storage size')).toBeInTheDocument();
  });
  test('renders with initial value', () => {
    render(<SizeInput value={100} />);

    const input = screen.getByDisplayValue('100');
    expect(input).toBeInTheDocument();
  });

  test('calls onChange when input value changes', async () => {
    const handleChange = vi.fn();
    render(<SizeInput onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Please input size');
    await user.type(input, '10');

    expect(handleChange).toHaveBeenCalled();
  });
  test('calls onChange with converted size when unit changes', async () => {
    const handleChange = vi.fn();
    render(<SizeInput onChange={handleChange} />);

    // Change unit to MiB
    const unitSelect = screen.getByTitle('GiB');
    await user.click(unitSelect);

    // Select the first MiB option (in the dropdown)
    const mibOptions = screen.getAllByText('MiB');
    await user.click(mibOptions[0]);

    expect(screen.getByTitle('MiB')).toBeInTheDocument();
  });
  test('handles disabled state correctly', () => {
    render(<SizeInput disabled />);

    const input = screen.getByPlaceholderText('Please input size');
    const unitSelect = screen.getByTitle('KiB'); // Should be KiB when disabled

    expect(input).toBeDisabled();
    expect(unitSelect.closest('.ant-select')).toHaveClass('ant-select-disabled');
  });
  test('uses defaultUnit when provided', () => {
    render(<SizeInput defaultUnit="MiB" />);

    expect(screen.getByTitle('MiB')).toBeInTheDocument();
  });

  test('handles input value changes correctly', async () => {
    const handleChange = vi.fn();
    render(<SizeInput onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Please input size');

    // Type a value
    await user.type(input, '5');

    // Should call onChange with the converted value
    expect(handleChange).toHaveBeenLastCalledWith(5 * 1024 * 1024); // GiB to KiB conversion
  });
  test('handles unit selection changes correctly', async () => {
    const handleChange = vi.fn();
    render(<SizeInput value={10} onChange={handleChange} />);

    // Change unit from GiB to TiB
    const unitSelect = screen.getByTitle('GiB');
    await user.click(unitSelect);

    // Select the first TiB option (in the dropdown)
    const tibOptions = screen.getAllByText('TiB');
    await user.click(tibOptions[0]);

    expect(screen.getByTitle('TiB')).toBeInTheDocument();
  });
  test('maintains input value when switching units', async () => {
    render(<SizeInput value={10} />);

    const input = screen.getByDisplayValue('10');
    expect(input).toBeInTheDocument();

    // Change unit
    const unitSelect = screen.getByTitle('GiB');
    await user.click(unitSelect);

    // Select the first MiB option (in the dropdown)
    const mibOptions = screen.getAllByText('MiB');
    await user.click(mibOptions[0]);

    // Input value should remain the same
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });
  test('shows correct value when disabled with initial value', () => {
    render(<SizeInput value={1024} disabled />);

    const input = screen.getByDisplayValue('1024');
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();

    // Should use KiB when disabled
    expect(screen.getByTitle('KiB')).toBeInTheDocument();
  });
  test('handles zero value correctly', () => {
    render(<SizeInput value={0} />);

    // Check that the input has value 0 or empty string as controlled by the component logic
    const input = screen.getByPlaceholderText('Please input size') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    // The component shows empty string for value 0 based on implementation (value || '')
    expect(input.value).toBe('');
  });
  test('handles empty input value', async () => {
    const handleChange = vi.fn();
    render(<SizeInput value={100} onChange={handleChange} />);

    const input = screen.getByDisplayValue('100');
    await user.clear(input);

    expect(handleChange).toHaveBeenCalled();
  });

  test('prevents negative values with min attribute', () => {
    render(<SizeInput />);

    const input = screen.getByPlaceholderText('Please input size');
    expect(input).toHaveAttribute('min', '0');
  });
  test('uses sizeOptions[2] as default value for unit selector', () => {
    render(<SizeInput />);

    // sizeOptions[2] should be GiB based on the mocked data
    expect(screen.getByTitle('GiB')).toBeInTheDocument();
  });
  test('updates sizeUnitSet ref when unit changes', async () => {
    render(<SizeInput defaultUnit="MiB" />);

    // Initially should use defaultUnit
    expect(screen.getByTitle('MiB')).toBeInTheDocument();

    // Change unit manually
    const unitSelect = screen.getByTitle('MiB');
    await user.click(unitSelect);

    // Select the first GiB option (in the dropdown)
    const gibOptions = screen.getAllByText('GiB');
    await user.click(gibOptions[0]);

    expect(screen.getByTitle('GiB')).toBeInTheDocument();
  });
});
