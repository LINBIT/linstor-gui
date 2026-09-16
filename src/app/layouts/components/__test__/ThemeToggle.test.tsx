// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ThemeToggle from '../ThemeToggle';
import { ThemeModeProvider } from '@app/hooks';

const THEME_KEY = '__gui__theme';

const renderToggle = (collapsed = false) =>
  render(
    <ThemeModeProvider>
      <ThemeToggle collapsed={collapsed} />
    </ThemeModeProvider>,
  );

const checked = (name: string) => screen.getByRole('radio', { name }).getAttribute('aria-checked');

describe('ThemeToggle', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_KEY);
    document.documentElement.removeAttribute('data-theme');
  });

  it('starts on the light theme and flips to dark on click', () => {
    renderToggle();

    expect(screen.getByRole('radiogroup', { name: 'Color theme' })).toBeInTheDocument();
    expect(checked('Light')).toBe('true');
    expect(checked('Dark')).toBe('false');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(checked('Dark')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));

    expect(checked('Light')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('honours the persisted choice on mount', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    renderToggle();

    expect(checked('Dark')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('moves with the arrow keys', () => {
    renderToggle();
    const group = screen.getByRole('radiogroup');

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(checked('Dark')).toBe('true');

    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(checked('Light')).toBe('true');

    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(checked('Dark')).toBe('true');

    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(checked('Light')).toBe('true');
  });

  it('collapses to a single button that toggles the theme', () => {
    renderToggle(true);

    const button = screen.getByRole('button', { name: 'Switch to dark theme' });
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});
