// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import GeneralSettings from '..';
import { getControllerVersion } from '@app/features/node/api';
import { renderSettings } from './helpers';

const hoisted = vi.hoisted(() => ({
  dispatch: { setting: { getSettings: vi.fn() } },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => hoisted.dispatch,
}));

vi.mock('@app/features/node/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/node/api')>()),
  getControllerVersion: vi.fn(),
}));

// Each tab has its own suite; here only the tab set and its gate matter.
vi.mock('../components/Logo', () => ({ default: () => <div data-testid="logo-tab" /> }));
vi.mock('../components/Gateway', () => ({ default: () => <div data-testid="gateway-tab" /> }));
vi.mock('../components/Dashboard', () => ({ default: () => <div data-testid="dashboard-tab" /> }));
vi.mock('../components/ControllerAuth', () => ({ default: () => <div data-testid="auth-tab" /> }));

const tabLabels = () => Array.from(document.querySelectorAll('.ant-tabs-tab')).map((el) => el.textContent);

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.28.0' } } as never);
  });

  it('loads the stored settings once on mount', async () => {
    renderSettings(<GeneralSettings />);

    await waitFor(() => expect(hoisted.dispatch.setting.getSettings).toHaveBeenCalledTimes(1));
  });

  it('opens on the general tab', async () => {
    renderSettings(<GeneralSettings />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByTestId('logo-tab')).toBeInTheDocument();
    await waitFor(() => expect(tabLabels()).toEqual(['General', 'Gateway', 'Grafana', 'Controller Auth']));
  });

  it('switches to the tab that was clicked', async () => {
    renderSettings(<GeneralSettings />);

    fireEvent.click(screen.getByRole('tab', { name: 'Grafana' }));
    await waitFor(() => expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument());
  });

  it('keeps the controller-auth tab while the controller version is unknown', () => {
    vi.mocked(getControllerVersion).mockReturnValue(new Promise(() => undefined) as never);
    renderSettings(<GeneralSettings />);

    // Optimistic: hiding it on every load would make the tab flicker.
    expect(tabLabels()).toContain('Controller Auth');
  });

  it('drops the controller-auth tab on a controller older than 1.28.0', async () => {
    vi.mocked(getControllerVersion).mockResolvedValue({ data: { rest_api_version: '1.27.9' } } as never);
    renderSettings(<GeneralSettings />);

    await waitFor(() => expect(tabLabels()).toEqual(['General', 'Gateway', 'Grafana']));
  });
});
