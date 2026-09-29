// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { makeSettings } from '@app/__test__/helpers';
import type { SettingsContextValue } from '@app/features/settings/useSettings';

// The provider on a real QueryClient; the user api, the settings api and the
// settings context are replaced.

const authAPI = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  deleteUser: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  updatePassword: vi.fn(),
  getUsers: vi.fn(),
  resetAuthenticationSystem: vi.fn(),
}));
vi.mock('@app/features/authentication/api', () => ({ default: authAPI }));

const settingAPI = vi.hoisted(() => ({ getProps: vi.fn() }));
vi.mock('@app/features/settings', () => ({ settingAPI }));

const settings = vi.hoisted(() => ({ current: undefined as SettingsContextValue | undefined }));
vi.mock('@app/features/settings/useSettings', () => ({ useSettings: () => settings.current }));

import { AuthProvider } from '../AuthProvider';
import { useAuth, useUsers, type AuthContextValue } from '../useAuth';

const KEY = 'linstorname';

const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const current: { auth?: AuthContextValue; users?: ReturnType<typeof useUsers> } = {};
  const Probe = () => {
    current.auth = useAuth();
    current.users = useUsers();
    return null;
  };
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { auth: () => current.auth as AuthContextValue, users: () => current.users?.data };
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    settings.current = makeSettings();
    authAPI.getUsers.mockResolvedValue(['admin', 'bob', '__updated__', '__migrated_from__']);
    settingAPI.getProps.mockResolvedValue({});
  });

  it('refuses to work outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });

  it('lists only real, non-admin users', async () => {
    const { users } = setup();
    await waitFor(() => expect(users()).toEqual(['bob']));
  });

  it('register reloads the user list only when the api accepted the user', async () => {
    const { auth, users } = setup();
    await waitFor(() => expect(users()).toEqual(['bob']));
    authAPI.register.mockResolvedValue(false);
    await act(() => auth().register({ username: 'eve', password: 'x' }));
    expect(authAPI.getUsers).toHaveBeenCalledTimes(1);

    authAPI.register.mockResolvedValue(true);
    authAPI.getUsers.mockResolvedValue(['bob', 'eve']);
    await act(() => auth().register({ username: 'eve', password: 'x' }));
    await waitFor(() => expect(users()).toEqual(['bob', 'eve']));
  });

  describe('login', () => {
    it('a refused login changes nothing', async () => {
      authAPI.login.mockResolvedValue(false);
      const { auth } = setup();
      await act(async () => {
        expect(await auth().login({ username: 'bob', password: 'x' })).toBe(false);
      });
      expect(auth()).toMatchObject({ isLoggedIn: false, username: null, isAdmin: false });
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('a normal user logs in without the admin checks', async () => {
      authAPI.login.mockResolvedValue(true);
      const { auth } = setup();
      await act(() => auth().login({ username: 'bob', password: 'x' }));
      expect(auth()).toMatchObject({ isLoggedIn: true, username: 'bob', isAdmin: false, needsPasswordChange: false });
      expect(localStorage.getItem(KEY)).toBe('bob');
      expect(settingAPI.getProps).not.toHaveBeenCalled();
      // The navigation's admin flag is recomputed from the stored user.
      expect(settings.current?.refreshAdmin).toHaveBeenCalled();
    });

    it('admin with the explicit flag is asked to change the default password', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockResolvedValue({ needsPasswordChange: true });
      const { auth } = setup();
      await act(() => auth().login({ username: 'admin', password: 'admin' }));
      expect(auth()).toMatchObject({ isAdmin: true, needsPasswordChange: true });
    });

    it('a stale flag does not ask an admin who logged in with a real password', async () => {
      // Authentication turned off and on again over an admin whose password had changed.
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockResolvedValue({ needsPasswordChange: true });
      const { auth } = setup();
      await act(() => auth().login({ username: 'admin', password: 'E2eAdmin-1' }));
      expect(auth()).toMatchObject({ isAdmin: true, needsPasswordChange: false });
    });

    it('admin with the flag cleared is not asked, even on the default password', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockResolvedValue({ needsPasswordChange: false });
      const { auth } = setup();
      await act(() => auth().login({ username: 'admin', password: 'admin' }));
      expect(auth().needsPasswordChange).toBe(false);
    });

    it.each([
      [{}, 'admin', true],
      [{ hideDefaultCredential: true }, 'admin', false],
      [{}, 'custom', false],
    ])(
      'without the flag (old installs), settings %j with password %s prompts: %s',
      async (props, password, prompts) => {
        authAPI.login.mockResolvedValue(true);
        settingAPI.getProps.mockResolvedValue(props);
        const { auth } = setup();
        await act(() => auth().login({ username: 'admin', password }));
        expect(auth().needsPasswordChange).toBe(prompts);
      },
    );

    it('a settings failure does not block the login', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockRejectedValue(new Error('kv down'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { auth } = setup();
      await act(async () => {
        expect(await auth().login({ username: 'admin', password: 'admin' })).toBe(true);
      });
      expect(auth()).toMatchObject({ isLoggedIn: true, isAdmin: true, needsPasswordChange: false });
    });
  });

  it('logout clears the user and the stored name', async () => {
    authAPI.login.mockResolvedValue(true);
    const { auth } = setup();
    await act(() => auth().login({ username: 'bob', password: 'x' }));
    act(() => auth().logout());
    expect(auth()).toMatchObject({ isLoggedIn: false, username: null });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('a user signing in after the admin logged out inherits neither admin nor the password prompt', async () => {
    authAPI.login.mockResolvedValue(true);
    settingAPI.getProps.mockResolvedValue({ needsPasswordChange: true });
    const { auth } = setup();
    await act(() => auth().login({ username: 'admin', password: 'admin' }));
    expect(auth()).toMatchObject({ isAdmin: true, needsPasswordChange: true });

    act(() => auth().logout());
    expect(auth()).toMatchObject({ isAdmin: false, needsPasswordChange: false });
    expect(settings.current?.refreshAdmin).toHaveBeenCalled();

    await act(() => auth().login({ username: 'bob', password: 'x' }));
    expect(auth()).toMatchObject({ username: 'bob', isAdmin: false, needsPasswordChange: false });
  });

  it('deleting yourself logs you out; deleting someone else only reloads the list', async () => {
    authAPI.login.mockResolvedValue(true);
    authAPI.deleteUser.mockResolvedValue(undefined);
    const { auth } = setup();
    await act(() => auth().login({ username: 'bob', password: 'x' }));

    await act(() => auth().deleteUser('eve'));
    expect(auth().isLoggedIn).toBe(true);

    await act(() => auth().deleteUser('bob'));
    expect(auth().isLoggedIn).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('deleteUser resolves only after the user list is reloaded', async () => {
    authAPI.deleteUser.mockResolvedValue(undefined);
    const { auth, users } = setup();
    await waitFor(() => expect(users()).toEqual(['bob']));
    let finish!: (v: string[]) => void;
    authAPI.getUsers.mockReturnValue(new Promise((resolve) => (finish = resolve)));

    let done = false;
    let deleting!: Promise<void>;
    act(() => {
      deleting = auth()
        .deleteUser('bob')
        .then(() => {
          done = true;
        });
    });
    await waitFor(() => expect(authAPI.getUsers).toHaveBeenCalledTimes(2));
    expect(done).toBe(false);
    await act(async () => {
      finish([]);
      await deleting;
    });
    expect(done).toBe(true);
  });

  it('deleteUser rejects when the store refuses, without reloading', async () => {
    authAPI.deleteUser.mockRejectedValue(new Error('read only'));
    const { auth, users } = setup();
    await waitFor(() => expect(users()).toEqual(['bob']));
    await act(async () => {
      await expect(auth().deleteUser('bob')).rejects.toThrow('read only');
    });
    expect(authAPI.getUsers).toHaveBeenCalledTimes(1);
  });

  it('changePassword and updatePassword clear the prompt on success only', async () => {
    authAPI.login.mockResolvedValue(true);
    settingAPI.getProps.mockResolvedValue({ needsPasswordChange: true });
    const { auth } = setup();
    await act(() => auth().login({ username: 'admin', password: 'admin' }));

    authAPI.changePassword.mockResolvedValue(false);
    await act(() => auth().changePassword({ user: 'admin', oldPassword: 'a', newPassword: 'b' }));
    expect(auth().needsPasswordChange).toBe(true);

    authAPI.changePassword.mockResolvedValue(true);
    await act(() => auth().changePassword({ user: 'admin', oldPassword: 'a', newPassword: 'b' }));
    expect(auth().needsPasswordChange).toBe(false);

    act(() => auth().setNeedsPasswordChange(true));
    authAPI.updatePassword.mockResolvedValue(true);
    await act(() => auth().updatePassword({ user: 'admin', newPassword: 'c' }));
    expect(auth().needsPasswordChange).toBe(false);
  });

  describe('checkLoginStatus', () => {
    it('does nothing without a stored user', async () => {
      const { auth } = setup();
      await act(() => auth().checkLoginStatus());
      expect(auth().isLoggedIn).toBe(false);
    });

    it('restores a stored admin and applies the password-change rule', async () => {
      localStorage.setItem(KEY, 'admin');
      settingAPI.getProps.mockResolvedValue({});
      const { auth } = setup();
      await act(() => auth().checkLoginStatus());
      expect(auth()).toMatchObject({ isLoggedIn: true, username: 'admin', isAdmin: true, needsPasswordChange: true });
    });
  });

  it('resetAuthenticationSystem logs out and reloads users when they were kept', async () => {
    authAPI.login.mockResolvedValue(true);
    authAPI.resetAuthenticationSystem.mockResolvedValue(true);
    const { auth, users } = setup();
    await waitFor(() => expect(users()).toEqual(['bob']));
    await act(() => auth().login({ username: 'bob', password: 'x' }));

    await act(() => auth().resetAuthenticationSystem(true));
    expect(auth().isLoggedIn).toBe(false);
    expect(authAPI.getUsers).toHaveBeenCalledTimes(2);

    await act(() => auth().resetAuthenticationSystem(false));
    expect(authAPI.getUsers).toHaveBeenCalledTimes(2);
  });
});
