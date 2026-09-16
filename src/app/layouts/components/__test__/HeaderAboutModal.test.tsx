// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import HeaderAboutModal from '../HeaderAboutModal';
import { UIMode } from '@app/models/setting';

const state = vi.hoisted(() => ({ mode: 'NORMAL' as string }));

vi.mock('react-redux', () => ({
  useSelector: (selector: (s: unknown) => unknown) => selector({ setting: { mode: state.mode } }),
}));

const openAbout = async () => {
  const title = await screen.findByTitle('LINSTOR GUI Info');
  fireEvent.click(title.closest('svg') as SVGElement);
};

const row = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('HeaderAboutModal', () => {
  beforeEach(() => {
    state.mode = UIMode.NORMAL;
    vi.stubEnv('VITE_VERSION', '2.6.0');
    vi.stubEnv('LINBIT_SDS_VERSION', '1.0.1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.removeItem('HCI_VSAN_HOST');
  });

  it('opens the about panel from the dots icon and closes it again', async () => {
    render(<HeaderAboutModal linstorVersion={{ version: '1.35.0', rest_api_version: '1.30.0' }} />);

    expect(screen.queryByText('LINBIT-SDS')).toBeNull();
    await openAbout();

    expect(screen.getByText('LINBIT-SDS')).toBeInTheDocument();
    expect(row('LINSTOR Version')).toHaveTextContent('1.35.0');
    expect(row('UI Version')).toHaveTextContent('2.6.0');
    expect(row('LINBIT SDS Version')).toHaveTextContent('1.0.1');
    expect(row('Controller Active On')).toHaveTextContent(window.location.host);
    expect(row('Controller Binding IP')).toHaveTextContent('0.0.0.0');

    fireEvent.click(document.querySelector('.anticon-close')?.parentElement as HTMLElement);
    expect(screen.queryByText('LINBIT-SDS')).toBeNull();
  });

  it('reports unknown versions and hides the SDS row when the build set none', async () => {
    vi.stubEnv('VITE_VERSION', '');
    vi.stubEnv('LINBIT_SDS_VERSION', '');
    render(<HeaderAboutModal />);
    await openAbout();

    expect(row('LINSTOR Version')).toHaveTextContent('unknown');
    expect(row('UI Version')).toHaveTextContent('DEV');
    expect(screen.queryByText('LINBIT SDS Version')).toBeNull();
  });

  it('lets a DEV build in HCI mode override the HCI host', async () => {
    vi.stubEnv('VITE_VERSION', '');
    state.mode = UIMode.HCI;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<HeaderAboutModal />);
    await openAbout();

    fireEvent.click(screen.getByText('DEV'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('HCI Host');

    fireEvent.change(screen.getByPlaceholderText('https://192.168.0.1:1443'), {
      target: { value: 'https://10.0.0.5:1443' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(localStorage.getItem('HCI_VSAN_HOST')).toBe('https://10.0.0.5:1443');
    consoleError.mockRestore();
  });

  it('closes the host dialog on cancel without saving', async () => {
    vi.stubEnv('VITE_VERSION', '');
    state.mode = UIMode.HCI;
    render(<HeaderAboutModal />);
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
    render(<HeaderAboutModal />);
    await openAbout();

    fireEvent.click(screen.getByText('DEV'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
