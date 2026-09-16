// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import i18n from 'i18next';

import LngSelector from '../LngSelector';

describe('LngSelector', () => {
  afterEach(async () => {
    // Unmount first so the language reset does not re-render a live selector.
    cleanup();
    localStorage.removeItem('selectedLanguageKey');
    await i18n.changeLanguage('en');
  });

  it('defaults to English', () => {
    render(<LngSelector />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('switches the language, the short label and the stored key from the menu', async () => {
    const { container } = render(<LngSelector />);

    fireEvent.click(container.querySelector('.ant-dropdown-link') as HTMLElement);
    fireEvent.click(await screen.findByText('Deutsch (German)'));

    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(localStorage.getItem('selectedLanguageKey')).toBe('de');
    await waitFor(() => expect(i18n.language).toBe('de'));
  });

  it('restores the stored language on mount', async () => {
    localStorage.setItem('selectedLanguageKey', 'zh');
    render(<LngSelector />);

    expect(await screen.findByText('CN')).toBeInTheDocument();
    await waitFor(() => expect(i18n.language).toBe('zh'));
  });

  it('ignores a stored key that is not a known language', () => {
    localStorage.setItem('selectedLanguageKey', 'xx');
    render(<LngSelector />);

    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(i18n.language).toBe('en');
  });
});
