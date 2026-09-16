// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const dispatch = {
  auth: { getUsers: vi.fn(), deleteUser: vi.fn(), register: vi.fn(), resetPassword: vi.fn() },
  setting: { saveKey: vi.fn() },
};
let state: { users: string[]; authenticationEnabled?: boolean } = { users: [] };
vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (selector: (s: unknown) => unknown) =>
    selector({
      auth: { users: state.users },
      setting: { KVS: { authenticationEnabled: state.authenticationEnabled } },
    }),
}));

let isAdmin = true;
vi.mock('@app/hooks', () => ({
  useIsAdmin: () => isAdmin,
}));
// PageBasic needs the app's NavProvider; the page under test only needs
// its title and children.
vi.mock('@app/components/PageBasic', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));
vi.mock('@app/features/settings', () => ({
  settingAPI: { setProps: vi.fn() },
}));
vi.mock('@app/features/authentication/api', () => ({
  default: { initUserStore: vi.fn() },
  UserAuthAPI: class {},
}));
vi.mock('@app/utils/toast', () => ({
  notify: vi.fn(),
}));

import { settingAPI } from '@app/features/settings';
import authAPI from '@app/features/authentication/api';
import { notify } from '@app/utils/toast';
import { UserManagement } from '../UserManegment/UserManagement';

const renderPage = () => {
  const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin = true;
    state = { users: [], authenticationEnabled: false };
    // A successful toggle schedules window.location.reload two seconds later.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(settingAPI.setProps).mockResolvedValue(true);
    vi.mocked(authAPI.initUserStore).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('with authentication off it shows the switch and no users', () => {
    renderPage();
    expect(screen.getByText('Authentication & Users')).toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByText('There are no users created yet.')).toBeInTheDocument();
    expect(dispatch.auth.getUsers).not.toHaveBeenCalled();
  });

  it('enabling authentication writes the flags, initialises the user store and reports', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(settingAPI.setProps).toHaveBeenCalledWith({
        authenticationEnabled: true,
        hideDefaultCredential: false,
        needsPasswordChange: true,
      }),
    );
    await waitFor(() => expect(authAPI.initUserStore).toHaveBeenCalled());
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Authentication is now enabled successfully', { type: 'success' }),
    );
  });

  it('disabling authentication leaves the user store alone', async () => {
    state = { users: ['admin'], authenticationEnabled: true };
    renderPage();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(dispatch.auth.getUsers).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(settingAPI.setProps).toHaveBeenCalledWith({ authenticationEnabled: false, hideDefaultCredential: false }),
    );
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Authentication is now disabled successfully', { type: 'success' }),
    );
    expect(authAPI.initUserStore).not.toHaveBeenCalled();
  });

  it('reports a failed toggle', async () => {
    vi.mocked(settingAPI.setProps).mockRejectedValue(new Error('kv down'));
    renderPage();
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Failed to update the authentication status', { type: 'error' }),
    );
  });

  it('lists users with their initial and deletes one after confirm', async () => {
    state = { users: ['admin', 'bob'], authenticationEnabled: true };
    renderPage();
    const bob = screen.getByText('bob').closest('.ant-list-item') as HTMLElement;
    expect(within(bob).getByText('B')).toBeInTheDocument();
    expect(within(bob).getByText('User 2')).toBeInTheDocument();

    fireEvent.click(within(bob).getByRole('button', { name: 'Delete user' }));
    expect(await screen.findByText('Are you sure to delete this user?')).toBeInTheDocument();
    expect(dispatch.auth.deleteUser).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(dispatch.auth.deleteUser).toHaveBeenCalledWith('bob'));
  });

  it('a non-admin with authentication on can look but not touch', () => {
    isAdmin = false;
    state = { users: ['admin', 'bob'], authenticationEnabled: true };
    renderPage();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a user' })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Delete user' })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole('button', { name: 'Reset password' })) {
      expect(button).toBeDisabled();
    }
  });
});
