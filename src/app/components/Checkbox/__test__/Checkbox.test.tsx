// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '../index';

describe('Checkbox Component', () => {
  it('renders without crashing', () => {
    render(<Checkbox>Test Checkbox</Checkbox>);
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    render(<Checkbox checked>Checked Checkbox</Checkbox>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders unchecked state', () => {
    render(<Checkbox checked={false}>Unchecked Checkbox</Checkbox>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('handles onChange callback', () => {
    const handleChange = vi.fn();
    render(<Checkbox onChange={handleChange}>Click me</Checkbox>);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state', () => {
    render(<Checkbox disabled>Disabled Checkbox</Checkbox>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('renders with custom className', () => {
    const { container } = render(<Checkbox className="custom-class">Custom Class</Checkbox>);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with custom style', () => {
    const customStyle = { marginLeft: '20px' };
    const { container } = render(<Checkbox style={customStyle}>Styled Checkbox</Checkbox>);
    const wrapper = container.querySelector('.ant-checkbox-wrapper');
    expect(wrapper).toHaveAttribute('style');
  });

  it('renders indeterminate state', () => {
    const { container } = render(<Checkbox indeterminate>Indeterminate Checkbox</Checkbox>);
    const checkboxInner = container.querySelector('.ant-checkbox-indeterminate');
    expect(checkboxInner).toBeInTheDocument();
  });

  it('supports default checked state', () => {
    render(<Checkbox defaultChecked>Default Checked</Checkbox>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('supports value prop', () => {
    render(<Checkbox value="test-value">Value Checkbox</Checkbox>);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('value', 'test-value');
  });
});
