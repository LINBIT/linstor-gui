// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Radio } from '../index';

describe('Radio Component', () => {
  it('renders without crashing', () => {
    render(<Radio>Test Radio</Radio>);
    expect(screen.getByText('Test Radio')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    render(<Radio checked>Checked Radio</Radio>);
    const radio = screen.getByRole('radio');
    expect(radio).toBeChecked();
  });

  it('renders unchecked state', () => {
    render(<Radio checked={false}>Unchecked Radio</Radio>);
    const radio = screen.getByRole('radio');
    expect(radio).not.toBeChecked();
  });

  it('handles onChange callback', () => {
    const handleChange = vi.fn();
    render(<Radio onChange={handleChange}>Click me</Radio>);
    const radio = screen.getByRole('radio');
    fireEvent.click(radio);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state', () => {
    render(<Radio disabled>Disabled Radio</Radio>);
    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();
  });

  it('renders with custom className', () => {
    const { container } = render(<Radio className="custom-class">Custom Class</Radio>);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with custom style', () => {
    const customStyle = { marginLeft: '20px' };
    const { container } = render(<Radio style={customStyle}>Styled Radio</Radio>);
    const wrapper = container.querySelector('.ant-radio-wrapper');
    expect(wrapper).toHaveAttribute('style');
  });

  it('supports default checked state', () => {
    render(<Radio defaultChecked>Default Checked</Radio>);
    const radio = screen.getByRole('radio');
    expect(radio).toBeChecked();
  });

  it('supports value prop', () => {
    render(<Radio value="test-value">Value Radio</Radio>);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('value', 'test-value');
  });
});

describe('Radio.Group Component', () => {
  it('renders radio group with options', () => {
    const options = [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 3', value: '3' },
    ];
    render(<Radio.Group options={options} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders radio group with children', () => {
    render(
      <Radio.Group>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </Radio.Group>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('handles onChange callback in group', () => {
    const handleChange = vi.fn();
    render(
      <Radio.Group onChange={handleChange}>
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </Radio.Group>,
    );
    const radioB = screen.getByLabelText('B');
    fireEvent.click(radioB);
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with selected value', () => {
    render(
      <Radio.Group value="b">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </Radio.Group>,
    );
    const radioB = screen.getByLabelText('B');
    expect(radioB).toBeChecked();
  });

  it('renders disabled group', () => {
    render(
      <Radio.Group
        disabled
        options={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]}
      />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
    // When using options array, disabled prop should be applied
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it('supports button style', () => {
    const { container } = render(
      <Radio.Group optionType="button">
        <Radio.Button value="a">A</Radio.Button>
        <Radio.Button value="b">B</Radio.Button>
      </Radio.Group>,
    );
    expect(container.querySelector('.ant-radio-button-wrapper')).toBeInTheDocument();
  });

  it('supports default value', () => {
    render(
      <Radio.Group defaultValue="b">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
        <Radio value="c">C</Radio>
      </Radio.Group>,
    );
    const radioB = screen.getByLabelText('B');
    expect(radioB).toBeChecked();
  });
});
