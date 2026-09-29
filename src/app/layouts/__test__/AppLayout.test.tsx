// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import AppLayout from '../AppLayout';
import { NavContext } from '@app/hooks/useNav';
import { UIMode, type SettingsProps } from '@app/features/settings/types';
import type { SettingsContextValue } from '@app/features/settings/useSettings';
import type { AuthContextValue } from '@app/features/authentication/useAuth';
import { makeAuth, makeSettings } from '@app/__test__/helpers';

const hoisted = vi.hoisted(() => ({
  settings: undefined as SettingsContextValue | undefined,
  auth: undefined as AuthContextValue | undefined,
}));

vi.mock('@app/features/settings/useSettings', async (orig) => ({
  ...(await orig()),
  useSettings: () => hoisted.settings,
}));

vi.mock('@app/features/authentication/useAuth', async (orig) => ({
  ...(await orig()),
  useAuth: () => hoisted.auth,
}));

const withKVS = (KVS: Partial<SettingsProps>, mode = UIMode.NORMAL) => {
  hoisted.settings = makeSettings({ KVS, mode });
};

const loggedIn = (needsPasswordChange: boolean) => {
  hoisted.auth = makeAuth({ isLoggedIn: true, isAdmin: true, needsPasswordChange, username: 'admin' });
};

vi.mock('@app/features/authentication/pages/Login', () => ({
  Login: ({ redirectTo }: { redirectTo?: string }) => <div data-testid="login">{redirectTo}</div>,
}));

vi.mock('@app/features/authentication/components/ChangePassword/ChangePassword', () => ({
  ChangePassword: () => <div data-testid="change-password" />,
}));

vi.mock('../components/Navigation', () => ({
  default: ({ isNavOpen }: { isNavOpen?: boolean }) => (
    <nav data-testid="navigation" data-collapsed={String(isNavOpen)} />
  ),
}));

vi.mock('../components/ThemeToggle', () => ({ default: () => null }));

vi.mock('../components/LogoImg', () => ({
  LogoImg: ({ logoSrc }: { logoSrc?: string }) => <div data-testid="logo">{logoSrc}</div>,
}));

vi.mock('../components/HeaderTools', () => ({
  default: (props: Record<string, unknown> & { onModeChange: (mode: string) => void }) => (
    <div data-testid="header-tools">
      <button onClick={() => props.onModeChange('VSAN')}>mode-vsan</button>
      <button onClick={() => props.onModeChange('HCI')}>mode-hci</button>
      <button onClick={() => props.onModeChange('NORMAL')}>mode-normal</button>
      <span data-testid="header-props">
        {JSON.stringify({
          username: (props.authInfo as { username: string }).username,
          isNotOfficialBuild: props.isNotOfficialBuild,
          normalWithoutAuth: props.normalWithoutAuth,
          vsan: props.vsanModeFromSetting,
          hci: props.hciModeFromSetting,
        })}
      </span>
    </div>
  ),
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
};

type LayoutProps = Omit<React.ComponentProps<typeof AppLayout>, 'children'>;

const renderLayout = (path = '/', props: LayoutProps = {}) => {
  const toggleNav = vi.fn();
  const setNavOpen = vi.fn();
  const utils = render(
    <NavContext.Provider value={{ isNavOpen: false, toggleNav, setNavOpen }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="*"
            element={
              <AppLayout {...props}>
                <div data-testid="page">page content</div>
                <LocationProbe />
              </AppLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    </NavContext.Provider>,
  );
  return { ...utils, toggleNav, setNavOpen };
};

const headerProps = () => JSON.parse(screen.getByTestId('header-props').textContent || '{}');

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('__gui__mode');
    withKVS({ authenticationEnabled: false, vsanAvailable: false });
    hoisted.auth = makeAuth({ username: '' });
  });

  it('renders the page and boots the stores when authentication is off', () => {
    renderLayout('/');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.queryByTestId('login')).toBeNull();
    expect(hoisted.auth!.checkLoginStatus).toHaveBeenCalledTimes(1);
    // The provider loads the settings on mount; the layout does not load them again.
    expect(hoisted.settings!.refresh).not.toHaveBeenCalled();
    // The gateway is probed by the settings provider once the host is known, not by the layout.
    expect(hoisted.settings!.getGatewayStatus).not.toHaveBeenCalled();
    expect(hoisted.settings!.initSettingStore).toHaveBeenCalledWith(UIMode.NORMAL);
    expect(hoisted.settings!.setMode).toHaveBeenCalledWith(UIMode.NORMAL);
    expect(hoisted.settings!.getMyLinbitStatus).not.toHaveBeenCalled();
    expect(localStorage.getItem('__gui__mode')).toBe('NORMAL');
    expect(headerProps()).toMatchObject({ normalWithoutAuth: true, vsan: false, hci: false });
  });

  it('shows the login page with the return path when authentication is on and nobody is logged in', async () => {
    withKVS({ authenticationEnabled: true });
    renderLayout('/inventory/nodes?tab=1');

    // The layout drops the query string before the login page settles on its return path.
    await waitFor(() => expect(screen.getByTestId('login')).toHaveTextContent(/^\/inventory\/nodes$/));
    expect(screen.queryByTestId('page')).toBeNull();
  });

  it('sends the login page back to the root when it was reached directly', () => {
    withKVS({ authenticationEnabled: true });
    renderLayout('/login');

    expect(screen.getByTestId('login')).toHaveTextContent('/');
  });

  it('renders the page for a logged-in user and asks to change a default password', () => {
    withKVS({ authenticationEnabled: true });
    loggedIn(true);
    renderLayout('/');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(screen.getByTestId('change-password')).toBeInTheDocument();
    expect(headerProps()).toMatchObject({ username: 'admin', normalWithoutAuth: false });
  });

  it('does not ask a logged-in user with a fresh password to change it', () => {
    withKVS({ authenticationEnabled: true });
    loggedIn(false);
    renderLayout('/');

    expect(screen.queryByTestId('change-password')).toBeNull();
  });

  it('initialises the VSAN store from a VSAN route', () => {
    withKVS({ authenticationEnabled: false, vsanAvailable: false }, UIMode.VSAN);
    renderLayout('/vsan/dashboard');

    expect(hoisted.settings!.initSettingStore).toHaveBeenCalledWith(UIMode.VSAN);
    expect(hoisted.settings!.setMode).toHaveBeenCalledWith(UIMode.VSAN);
    expect(hoisted.settings!.getMyLinbitStatus).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('__gui__mode')).toBe('VSAN');
    expect(headerProps()).toMatchObject({ vsan: true, hci: false });
  });

  it('initialises the HCI store from an HCI route', () => {
    withKVS({ authenticationEnabled: false, vsanAvailable: false }, UIMode.HCI);
    renderLayout('/hci/dashboard');

    expect(hoisted.settings!.initSettingStore).toHaveBeenCalledWith(UIMode.HCI);
    expect(hoisted.settings!.setMode).toHaveBeenCalledWith(UIMode.HCI);
    expect(hoisted.settings!.getMyLinbitStatus).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('__gui__mode')).toBe('HCI');
    expect(headerProps()).toMatchObject({ vsan: false, hci: true });
  });

  it('strips query parameters from the URL', async () => {
    renderLayout('/inventory/nodes?tab=1');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/inventory\/nodes$/));
  });

  it('toggles the sidebar from the menu button', () => {
    const { container, toggleNav } = renderLayout('/');

    fireEvent.click(container.querySelector('.ant-layout-header button') as HTMLElement);
    expect(toggleNav).toHaveBeenCalledTimes(1);
  });

  it('switches mode from the header tools and navigates to the mode dashboard', async () => {
    const { toggleNav } = renderLayout('/');

    fireEvent.click(screen.getByText('mode-vsan'));
    expect(toggleNav).toHaveBeenCalledTimes(1);
    expect(hoisted.settings!.setMode).toHaveBeenLastCalledWith(UIMode.VSAN);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/vsan/dashboard'));
    expect(hoisted.settings!.getMyLinbitStatus).toHaveBeenCalled();

    fireEvent.click(screen.getByText('mode-hci'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/hci/dashboard'));

    fireEvent.click(screen.getByText('mode-normal'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    expect(localStorage.getItem('__gui__mode')).toBe('NORMAL');
  });

  it('opens the unofficial build notice once the status check says so', async () => {
    renderLayout('/', { isSpaceTrackingUnavailable: true, isCheckingStatus: false });

    expect(await screen.findByText('Attention! You are using an unsupported build of this software.')).toBeVisible();
    expect(headerProps()).toMatchObject({ isNotOfficialBuild: true });

    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(screen.getByText('For Official Builds'));
    expect(open).toHaveBeenCalledWith('https://linbit.com/sds-subscription/', '_blank');
    open.mockRestore();
  });

  it('keeps the notice closed while the status is still being checked', () => {
    renderLayout('/', { isSpaceTrackingUnavailable: true, isCheckingStatus: true });

    expect(screen.queryByText('Attention! You are using an unsupported build of this software.')).toBeNull();
    expect(headerProps()).toMatchObject({ isNotOfficialBuild: false });
  });

  it('reveals the back-to-top button after scrolling down', () => {
    renderLayout('/');
    const button = document.querySelector('.ant-float-btn') as HTMLElement;
    expect(button.style.display).toBe('none');

    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true, writable: true });
    fireEvent.scroll(window);
    expect(button.style.display).toBe('block');

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    fireEvent.scroll(window);
    expect(button.style.display).toBe('none');
  });
});
