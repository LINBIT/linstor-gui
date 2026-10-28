// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach, onTestFinished } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import HeaderAboutModal from '../HeaderAboutModal';
import { controllerActiveOn } from '../controllerActiveOn';
import { useControllerHa } from '@app/features/node/hooks/useActiveController';
import { UIMode } from '@app/features/settings/types';
import type { SettingsContextValue } from '@app/features/settings/useSettings';
import { makeSettings } from '@app/__test__/helpers';

const settings = vi.hoisted(() => ({ current: undefined as SettingsContextValue | undefined }));

vi.mock('@app/features/settings/useSettings', async (orig) => ({
  ...(await orig()),
  useSettings: () => settings.current,
}));

vi.mock('@app/features/node/hooks/useActiveController', async (orig) => ({
  ...(await orig()),
  useControllerHa: vi.fn(),
}));

const haActiveOn = (active?: string) =>
  vi.mocked(useControllerHa).mockReturnValue({ enabled: !!active, active, standby: [], isPending: false });

const renderAbout = (ui: ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

const openAbout = async () => {
  const title = await screen.findByTitle('LINSTOR GUI Info');
  fireEvent.click(title.closest('svg') as SVGElement);
};

const row = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('HeaderAboutModal', () => {
  beforeEach(() => {
    settings.current = makeSettings({ mode: UIMode.NORMAL });
    haActiveOn('node-b');
    vi.stubEnv('VITE_VERSION', '2.6.0');
    vi.stubEnv('LINBIT_SDS_VERSION', '1.0.1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.removeItem('HCI_VSAN_HOST');
    localStorage.removeItem('LINSTOR_HOST');
  });

  it('opens the about panel from the dots icon and closes it again', async () => {
    renderAbout(<HeaderAboutModal linstorVersion={{ version: '1.35.0', rest_api_version: '1.30.0' }} />);

    expect(screen.queryByText('LINBIT-SDS')).toBeNull();
    await openAbout();

    expect(screen.getByText('LINBIT-SDS')).toBeInTheDocument();
    expect(row('LINSTOR Version')).toHaveTextContent('1.35.0');
    expect(row('UI Version')).toHaveTextContent('2.6.0');
    expect(row('LINBIT SDS Version')).toHaveTextContent('1.0.1');
    expect(row('Controller Address')).toHaveTextContent(window.location.origin);
    expect(row('Controller Active On')).toHaveTextContent('node-b');

    fireEvent.click(document.querySelector('.anticon-close')?.parentElement as HTMLElement);
    expect(screen.queryByText('LINBIT-SDS')).toBeNull();
  });

  it('reports unknown versions and hides the SDS row when the build set none', async () => {
    vi.stubEnv('VITE_VERSION', '');
    vi.stubEnv('LINBIT_SDS_VERSION', '');
    renderAbout(<HeaderAboutModal />);
    await openAbout();

    expect(row('LINSTOR Version')).toHaveTextContent('unknown');
    expect(row('UI Version')).toHaveTextContent('DEV');
    expect(screen.queryByText('LINBIT SDS Version')).toBeNull();
  });

  it('lets a DEV build in HCI mode override the HCI host', async () => {
    vi.stubEnv('VITE_VERSION', '');
    settings.current = makeSettings({ mode: UIMode.HCI });
    // jsdom cannot reload a page; a location whose reload is a spy stands in.
    const { location } = window;
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...location, reload } });
    onTestFinished(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: location });
    });
    renderAbout(<HeaderAboutModal />);
    await openAbout();

    fireEvent.click(screen.getByText('DEV'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('HCI Host');

    fireEvent.change(screen.getByPlaceholderText('https://192.168.0.1:1443'), {
      target: { value: 'https://10.0.0.5:1443' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(localStorage.getItem('HCI_VSAN_HOST')).toBe('https://10.0.0.5:1443');
    expect(reload).toHaveBeenCalled();
  });

  it('closes the host dialog on cancel without saving', async () => {
    vi.stubEnv('VITE_VERSION', '');
    settings.current = makeSettings({ mode: UIMode.HCI });
    renderAbout(<HeaderAboutModal />);
    await openAbout();

    fireEvent.click(screen.getByText('DEV'));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      const wrap = document.querySelector('.ant-modal-wrap') as HTMLElement | null;
      expect(!wrap || wrap.style.display === 'none').toBe(true);
    });
    expect(localStorage.getItem('HCI_VSAN_HOST')).toBeNull();
  });

  it('does not offer the host override outside HCI mode or on release builds', async () => {
    vi.stubEnv('VITE_VERSION', '');
    renderAbout(<HeaderAboutModal />);
    await openAbout();

    fireEvent.click(screen.getByText('DEV'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the controller set with ?host= instead of the page origin', async () => {
    localStorage.setItem('LINSTOR_HOST', 'https://192.168.1.10:3371');
    renderAbout(<HeaderAboutModal linstorVersion={{ version: '1.35.0', rest_api_version: '1.29.1' }} />);
    await openAbout();

    expect(row('Controller Address')).toHaveTextContent(/^Controller Addresshttps:\/\/192\.168\.1\.10:3371$/);
  });

  it('leaves out the active node when nothing is known about it', async () => {
    haActiveOn(undefined);
    renderAbout(<HeaderAboutModal linstorVersion={{ version: '1.35.0', rest_api_version: '1.29.1' }} />);
    await openAbout();

    expect(row('Controller Address')).toHaveTextContent(window.location.origin);
    expect(screen.queryByText('Controller Active On')).toBeNull();
  });
});

describe('controllerActiveOn', () => {
  it('takes the host name the controller reports once its REST API has the field', () => {
    expect(controllerActiveOn({ rest_api_version: '1.30.0', host_name: 'node-a' }, 'node-b')).toBe('node-a');
    expect(controllerActiveOn({ rest_api_version: '1.31.0', host_name: 'node-a' }, undefined)).toBe('node-a');
  });

  it('falls back to the controller HA node on a 1.30.0 build without host_name and on older controllers', () => {
    expect(controllerActiveOn({ rest_api_version: '1.30.0' }, 'node-b')).toBe('node-b');
    expect(controllerActiveOn({ rest_api_version: '1.30.0', host_name: '' }, 'node-b')).toBe('node-b');
    expect(controllerActiveOn({ rest_api_version: '1.29.1', host_name: 'node-a' }, 'node-b')).toBe('node-b');
    expect(controllerActiveOn(undefined, 'node-b')).toBe('node-b');
  });

  it('knows nothing without either', () => {
    expect(controllerActiveOn({ rest_api_version: '1.29.1' }, undefined)).toBeUndefined();
  });
});
