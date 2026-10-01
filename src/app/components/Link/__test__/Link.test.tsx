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
import { tokens } from '@app/const/color';
import { cssVar } from '@app/const/themeTokens';

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

  // The classes read their colors from --link-* variables the component sets
  // per type; these pin the variables to the design tokens.
  it.each([
    [
      'link',
      {
        '--link-text': cssVar('text/link'),
        '--link-text-hover': tokens.color.link.hover,
        '--link-text-active': tokens.color.link.active,
      },
    ],
    [
      'primary',
      {
        '--link-text': tokens.color.brand.onPrimary,
        '--link-bg': tokens.color.brand.primary,
        '--link-bg-hover': tokens.color.brand.primaryHover,
        '--link-border': tokens.color.brand.primary,
      },
    ],
    [
      'secondary',
      {
        '--link-text': tokens.color.brand.onPrimary,
        '--link-bg': 'transparent',
        '--link-border': tokens.color.brand.primary,
        '--link-bg-hover': tokens.color.brand.primaryHover,
      },
    ],
    [
      'default',
      {
        '--link-text': tokens.color.brand.onPrimary,
        '--link-border': tokens.color.neutral.borderDefault,
        '--link-bg-hover': tokens.color.neutral.disabledBg,
      },
    ],
  ] as const)('a %s link carries its type and the token colors', (type, expected) => {
    renderWithRouter(
      <Link to="/test" type={type}>
        Styled Link
      </Link>,
    );
    const link = screen.getByText('Styled Link').closest('a') as HTMLAnchorElement;
    expect(link).toHaveAttribute('data-link-type', type);
    for (const [name, value] of Object.entries(expected)) {
      expect(link.style.getPropertyValue(name)).toBe(value);
    }
  });

  it("merges the caller's style over the type colors", () => {
    renderWithRouter(
      <Link to="/test" type="primary" style={{ '--link-text': 'red', marginTop: 4 } as React.CSSProperties}>
        Overridden Link
      </Link>,
    );
    const link = screen.getByText('Overridden Link').closest('a') as HTMLAnchorElement;
    expect(link.style.getPropertyValue('--link-text')).toBe('red');
    expect(link.style.getPropertyValue('--link-bg')).toBe(tokens.color.brand.primary);
    expect(link.style.marginTop).toBe('4px');
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
