// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init, type RematchDispatch, type RematchRootState } from '@rematch/core';
import type { RootModel } from '..';

// The auth model on a real rematch store, next to a minimal setting model
// (the real one drags the whole settings feature in); the user api and the
// settings api are replaced.

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

import { auth } from '../auth';

const KEY = 'linstorname';
const setAdmin = vi.fn();
const settingStub = {
  state: {},
  reducers: { setAdmin: (state: object) => (setAdmin(), state) },
};

// The stub setting model has no typings; only the auth slice is exercised.
const makeStore = () => init({ models: { auth, setting: settingStub } as never });
type Store = ReturnType<typeof makeStore>;
const dispatchOf = (store: Store) => store.dispatch as unknown as RematchDispatch<RootModel>;
const authState = (store: Store) => (store.getState() as unknown as RematchRootState<RootModel>).auth;

describe('auth model', () => {
  let store: Store;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store = makeStore();
    authAPI.getUsers.mockResolvedValue(['admin', 'bob', '__updated__', '__migrated_from__']);
    settingAPI.getProps.mockResolvedValue({});
  });

  it('getUsers keeps only real, non-admin users', async () => {
    await dispatchOf(store).auth.getUsers();
    expect(authState(store).users).toEqual(['bob']);
  });

  it('register refreshes the user list only when the api accepted the user', async () => {
    authAPI.register.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(dispatchOf(store).auth.register({ username: 'bob', password: 'pw' })).resolves.toBe(false);
    expect(authAPI.getUsers).not.toHaveBeenCalled();
    await expect(dispatchOf(store).auth.register({ username: 'bob', password: 'pw' })).resolves.toBe(true);
    expect(authAPI.getUsers).toHaveBeenCalled();
  });

  describe('login', () => {
    it('a refused login changes nothing', async () => {
      authAPI.login.mockResolvedValue(false);
      await expect(dispatchOf(store).auth.login({ username: 'bob', password: 'x' })).resolves.toBe(false);
      expect(authState(store)).toMatchObject({ isLoggedIn: false, username: null, isAdmin: false });
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('a normal user logs in without the admin checks', async () => {
      authAPI.login.mockResolvedValue(true);
      await dispatchOf(store).auth.login({ username: 'bob', password: 'x' });
      expect(authState(store)).toMatchObject({
        isLoggedIn: true,
        username: 'bob',
        isAdmin: false,
        needsPasswordChange: false,
      });
      expect(localStorage.getItem(KEY)).toBe('bob');
      expect(settingAPI.getProps).not.toHaveBeenCalled();
      expect(setAdmin).toHaveBeenCalled();
    });

    it('admin with the explicit flag is asked to change the password', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockResolvedValue({ needsPasswordChange: true });
      await dispatchOf(store).auth.login({ username: 'admin', password: 'anything' });
      expect(authState(store)).toMatchObject({ isAdmin: true, needsPasswordChange: true });
    });

    it('admin with the flag cleared is not asked, even on the default password', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockResolvedValue({ needsPasswordChange: false });
      await dispatchOf(store).auth.login({ username: 'admin', password: 'admin' });
      expect(authState(store).needsPasswordChange).toBe(false);
    });

    it('without the flag (old installs) the default password prompts unless the tip was hidden', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockResolvedValue({});
      await dispatchOf(store).auth.login({ username: 'admin', password: 'admin' });
      expect(authState(store).needsPasswordChange).toBe(true);

      store = makeStore();
      settingAPI.getProps.mockResolvedValue({ hideDefaultCredential: true });
      await dispatchOf(store).auth.login({ username: 'admin', password: 'admin' });
      expect(authState(store).needsPasswordChange).toBe(false);

      store = makeStore();
      settingAPI.getProps.mockResolvedValue({});
      await dispatchOf(store).auth.login({ username: 'admin', password: 'custom' });
      expect(authState(store).needsPasswordChange).toBe(false);
    });

    it('a settings failure does not block the login', async () => {
      authAPI.login.mockResolvedValue(true);
      settingAPI.getProps.mockRejectedValue(new Error('kv down'));
      await expect(dispatchOf(store).auth.login({ username: 'admin', password: 'admin' })).resolves.toBe(true);
      expect(authState(store)).toMatchObject({ isLoggedIn: true, isAdmin: true, needsPasswordChange: false });
    });
  });

  it('logout clears state and storage', async () => {
    authAPI.login.mockResolvedValue(true);
    await dispatchOf(store).auth.login({ username: 'bob', password: 'x' });
    dispatchOf(store).auth.logout();
    expect(authState(store)).toMatchObject({ isLoggedIn: false, username: null });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('deleting yourself logs you out; deleting someone else only refreshes the list', async () => {
    authAPI.login.mockResolvedValue(true);
    authAPI.deleteUser.mockResolvedValue(undefined);
    await dispatchOf(store).auth.login({ username: 'bob', password: 'x' });

    await dispatchOf(store).auth.deleteUser('carol');
    expect(authState(store).isLoggedIn).toBe(true);
    expect(authAPI.getUsers).toHaveBeenCalledTimes(1);

    await dispatchOf(store).auth.deleteUser('bob');
    expect(authState(store)).toMatchObject({ isLoggedIn: false, username: null });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('changePassword and updatePassword clear the prompt on success only', async () => {
    dispatchOf(store).auth.setNeedsPasswordChange(true);
    authAPI.changePassword.mockResolvedValue(false);
    await expect(
      dispatchOf(store).auth.changePassword({ user: 'admin', oldPassword: 'a', newPassword: 'b' }),
    ).resolves.toBe(false);
    expect(authState(store).needsPasswordChange).toBe(true);

    authAPI.updatePassword.mockResolvedValue(true);
    await expect(dispatchOf(store).auth.updatePassword({ user: 'admin', newPassword: 'b' })).resolves.toBe(true);
    expect(authState(store).needsPasswordChange).toBe(false);

    authAPI.resetPassword.mockResolvedValue(true);
    await expect(dispatchOf(store).auth.resetPassword({ user: 'bob', newPassword: 'c' })).resolves.toBe(true);
    expect(authAPI.resetPassword).toHaveBeenCalledWith('bob', 'c');
  });

  describe('checkLoginStatus', () => {
    it('does nothing without a stored user', async () => {
      await dispatchOf(store).auth.checkLoginStatus();
      expect(authState(store).isLoggedIn).toBe(false);
      expect(setAdmin).not.toHaveBeenCalled();
    });

    it('restores a stored admin and applies the password-change rule', async () => {
      localStorage.setItem(KEY, 'admin');
      settingAPI.getProps.mockResolvedValue({});
      await dispatchOf(store).auth.checkLoginStatus();
      expect(authState(store)).toMatchObject({
        isLoggedIn: true,
        username: 'admin',
        isAdmin: true,
        needsPasswordChange: true,
      });

      store = makeStore();
      settingAPI.getProps.mockResolvedValue({ needsPasswordChange: false });
      await dispatchOf(store).auth.checkLoginStatus();
      expect(authState(store).needsPasswordChange).toBe(false);
      expect(setAdmin).toHaveBeenCalled();
    });
  });

  it('resetAuthenticationSystem logs out and reloads users when they were kept', async () => {
    authAPI.login.mockResolvedValue(true);
    await dispatchOf(store).auth.login({ username: 'admin', password: 'x' });
    authAPI.resetAuthenticationSystem.mockResolvedValue(true);

    await expect(dispatchOf(store).auth.resetAuthenticationSystem(true)).resolves.toBe(true);
    expect(authState(store).isLoggedIn).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(authAPI.getUsers).toHaveBeenCalled();

    vi.clearAllMocks();
    authAPI.resetAuthenticationSystem.mockResolvedValue(false);
    await expect(dispatchOf(store).auth.resetAuthenticationSystem(false)).resolves.toBe(false);
    expect(authAPI.getUsers).not.toHaveBeenCalled();
  });
});
