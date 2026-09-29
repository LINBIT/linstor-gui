// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LogoImg } from '../LogoImg';
import { UIMode } from '@app/features/settings/types';
import type { SettingsContextValue } from '@app/features/settings/useSettings';
import { makeSettings } from '@app/__test__/helpers';

const settings = vi.hoisted(() => ({ current: undefined as SettingsContextValue | undefined }));

vi.mock('@app/features/settings/useSettings', async (orig) => ({
  ...(await orig()),
  useSettings: () => settings.current,
}));
const navigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

const renderLogo = (logoSrc?: string) =>
  render(
    <MemoryRouter>
      <LogoImg logoSrc={logoSrc} />
    </MemoryRouter>,
  );

const clickBrand = () => fireEvent.click(screen.getAllByAltText('LINBIT logo')[0]);

describe('LogoImg', () => {
  beforeEach(() => {
    navigate.mockClear();
    settings.current = makeSettings({ mode: UIMode.NORMAL });
  });

  it('renders the light and dark brand marks and no custom logo by default', () => {
    renderLogo();

    expect(screen.getAllByAltText('LINBIT logo')).toHaveLength(2);
    expect(screen.queryByText('|')).toBeNull();
    expect(screen.queryByAltText('logo')).toBeNull();
  });

  it('navigates to the dashboard of the current mode', () => {
    renderLogo();
    clickBrand();
    expect(navigate).toHaveBeenLastCalledWith('/');
  });

  it('navigates to the HCI dashboard in HCI mode', () => {
    settings.current = makeSettings({ mode: UIMode.HCI });
    renderLogo();
    clickBrand();
    expect(navigate).toHaveBeenLastCalledWith('/hci/dashboard');
  });

  it('navigates to the VSAN dashboard in VSAN mode', () => {
    settings.current = makeSettings({ mode: UIMode.VSAN });
    renderLogo();
    clickBrand();
    expect(navigate).toHaveBeenLastCalledWith('/vsan/dashboard');
  });

  it('renders a URL logo as an image next to a separator', () => {
    renderLogo('https://example.test/logo.png');

    expect(screen.getByText('|')).toBeInTheDocument();
    expect(screen.getByAltText('logo')).toHaveAttribute('src', 'https://example.test/logo.png');
  });

  it('renders inline SVG markup as an inline svg', async () => {
    const { container } = renderLogo(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle r="4" /></svg>',
    );

    expect(screen.getByText('|')).toBeInTheDocument();
    expect(screen.queryByAltText('logo')).toBeNull();
    await waitFor(() => expect(container.querySelector('svg.h-6 circle')).not.toBeNull());
  });

  it('renders neither image nor svg for a value that is not a URL or SVG', async () => {
    const { container } = renderLogo('just some text');

    expect(screen.getByText('|')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByAltText('logo')).toBeNull();
    expect(container.querySelector('svg.h-6')).toBeNull();
  });
});
