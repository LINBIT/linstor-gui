// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { makeAuth, makeSettings } from '@app/__test__/helpers';

const deleteUser = vi.fn();
// The user list query, as the page sees it: the users only while it is enabled.
const useUsers = vi.fn((enabled?: boolean) => ({ data: enabled ? state.users : undefined }));
let state: { users: string[]; authenticationEnabled?: boolean } = { users: [] };
vi.mock('@app/features/authentication/useAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/authentication/useAuth')>()),
  useAuth: () => makeAuth({ deleteUser }),
  useUsers: (enabled?: boolean) => useUsers(enabled),
}));
vi.mock('@app/features/settings/useSettings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@app/features/settings/useSettings')>()),
  useSettings: () => makeSettings({ KVS: { authenticationEnabled: state.authenticationEnabled } }),
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
  withQuietToasts: (fn: () => unknown) => fn(),
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
    expect(useUsers).not.toHaveBeenCalledWith(true);
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
    expect(useUsers).toHaveBeenCalledWith(true);
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
    expect(deleteUser).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('bob'));
  });

  it('marks the user while the delete runs and reports it, since the fetch proxy stays quiet for the KV store', async () => {
    let finish!: () => void;
    deleteUser.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    state = { users: ['admin', 'carol'], authenticationEnabled: true };
    renderPage();
    const carol = screen.getByText('carol').closest('.ant-list-item') as HTMLElement;
    fireEvent.click(within(carol).getByRole('button', { name: 'Delete user' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(carol).toHaveClass('opacity-50'));
    expect(screen.getByText('admin').closest('.ant-list-item')).not.toHaveClass('opacity-50');

    finish();
    await waitFor(() => expect(carol).not.toHaveClass('opacity-50'));
    expect(await screen.findByText('Deleted carol')).toBeInTheDocument();
    expect(deleteUser).toHaveBeenCalledTimes(1);
  });

  it('reports a failed user delete', async () => {
    deleteUser.mockRejectedValue(new Error('kv down'));
    state = { users: ['admin', 'bob'], authenticationEnabled: true };
    renderPage();
    const bob = screen.getByText('bob').closest('.ant-list-item') as HTMLElement;
    fireEvent.click(within(bob).getByRole('button', { name: 'Delete user' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    expect(await screen.findByText('Failed to delete bob: kv down')).toBeInTheDocument();
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
