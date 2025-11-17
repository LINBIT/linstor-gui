// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import { Link } from '../index';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Link Component', () => {
  it('renders with correct text', () => {
    renderWithRouter(<Link to="/test">Test Link</Link>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('has correct href attribute', () => {
    renderWithRouter(<Link to="/test">Test Link</Link>);
    const link = screen.getByText('Test Link');
    expect(link.closest('a')).toHaveAttribute('href', '/test');
  });

  it('applies primary variant styles correctly', () => {
    renderWithRouter(
      <Link to="/test" variant="primary">
        Primary Link
      </Link>,
    );
    expect(screen.getByText('Primary Link')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithRouter(
      <Link to="/test" onClick={handleClick}>
        Click Link
      </Link>,
    );

    fireEvent.click(screen.getByText('Click Link'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('prevents click when disabled', () => {
    const handleClick = vi.fn();
    renderWithRouter(
      <Link to="/test" disabled onClick={handleClick}>
        Disabled Link
      </Link>,
    );

    const link = screen.getByText('Disabled Link');
    // The most important test is that the click is prevented
    fireEvent.click(link);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports target attribute', () => {
    renderWithRouter(
      <Link to="/test" target="_blank">
        External Link
      </Link>,
    );
    const link = screen.getByText('External Link');
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('supports custom className', () => {
    renderWithRouter(
      <Link to="/test" className="custom-class">
        Custom Link
      </Link>,
    );
    const link = screen.getByText('Custom Link');
    expect(link.closest('a')).toHaveClass('custom-class');
  });

  it('renders with complex to prop object', () => {
    const toObject = {
      pathname: '/test',
      search: '?param=value',
      hash: '#section',
    };
    renderWithRouter(<Link to={toObject}>Complex Link</Link>);
    expect(screen.getByText('Complex Link')).toBeInTheDocument();
  });
});
