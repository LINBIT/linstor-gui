// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import HA from '..';

const installation = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/hooks')>()),
  useLinstorVersion: () => ({ isFetched: true, hasMinVersion: () => true }),
}));

// The page frame needs the navigation context; only its title, extra and content matter here.
vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {extra}
      {children}
    </main>
  ),
}));

vi.mock('@app/features/ha', () => ({
  List: () => <div>reactor list</div>,
  useReactorInstallation: () => installation(),
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/reactor']}>
      <Routes>
        <Route path="/reactor" element={<HA />} />
        <Route path="/reactor/create" element={<div>create page</div>} />
      </Routes>
    </MemoryRouter>,
  );

const createButton = () => screen.getByRole('button', { name: /common:create/ });

describe('DRBD Reactor page', () => {
  beforeEach(() => {
    installation.mockReturnValue({ notInstalled: [], installedNowhere: false });
  });

  it('opens the create page while some node has drbd-reactor', () => {
    installation.mockReturnValue({ notInstalled: ['node-b'], installedNowhere: false });
    renderPage();
    expect(createButton()).toBeEnabled();
    fireEvent.click(createButton());
    expect(screen.getByText('create page')).toBeInTheDocument();
  });

  it('disables Create and says why when no node has drbd-reactor', async () => {
    installation.mockReturnValue({ notInstalled: ['node-a', 'node-b'], installedNowhere: true });
    renderPage();
    expect(createButton()).toBeDisabled();
    fireEvent.click(createButton());
    expect(screen.queryByText('create page')).toBeNull();

    fireEvent.mouseEnter(createButton().parentElement as HTMLElement);
    await waitFor(() => expect(screen.getByText('ha:create_needs_reactor')).toBeInTheDocument());
  });
});
