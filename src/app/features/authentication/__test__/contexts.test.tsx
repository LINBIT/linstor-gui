// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// vi.mock is hoisted above every other statement, and contexts.tsx creates
// its UserAuthAPI at import time, so the spies must be hoisted as well.
const api = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  deleteUser: vi.fn(),
  changePassword: vi.fn(),
}));
vi.mock('../api', () => ({
  UserAuthAPI: class {
    register = api.register;
    login = api.login;
    deleteUser = api.deleteUser;
    changePassword = api.changePassword;
  },
}));

import { UserAuthProvider, useAuth } from '../contexts';

const KEY = 'linstorname';

const renderAuth = () => renderHook(() => useAuth(), { wrapper: UserAuthProvider });

describe('UserAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('outside a provider the context is inert', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(false);
    await expect(result.current.login({ username: 'a', password: 'b' })).resolves.toBe(false);
  });

  it('picks the logged-in user up from localStorage', () => {
    localStorage.setItem(KEY, 'alice');
    const { result } = renderAuth();
    expect(result.current).toMatchObject({ isLoggedIn: true, username: 'alice' });
  });

  it('login stores the user on success and leaves everything alone on failure', async () => {
    api.login.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderAuth();

    await act(async () => {
      await expect(result.current.login({ username: 'alice', password: 'wrong' })).resolves.toBe(false);
    });
    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();

    await act(async () => {
      await expect(result.current.login({ username: 'alice', password: 'right' })).resolves.toBe(true);
    });
    expect(result.current).toMatchObject({ isLoggedIn: true, username: 'alice' });
    expect(localStorage.getItem(KEY)).toBe('alice');
  });

  it('logout clears state and storage', async () => {
    localStorage.setItem(KEY, 'alice');
    const { result } = renderAuth();
    act(() => result.current.logout());
    expect(result.current).toMatchObject({ isLoggedIn: false, username: null });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('deleting yourself logs you out, deleting someone else does not', async () => {
    localStorage.setItem(KEY, 'alice');
    api.deleteUser.mockResolvedValue(undefined);
    const { result } = renderAuth();

    await act(async () => {
      await result.current.deleteUser('bob');
    });
    expect(api.deleteUser).toHaveBeenCalledWith('bob');
    expect(result.current.isLoggedIn).toBe(true);

    await act(async () => {
      await result.current.deleteUser('alice');
    });
    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('register and changePassword delegate to the api', async () => {
    api.register.mockResolvedValue(true);
    api.changePassword.mockResolvedValue(true);
    const { result } = renderAuth();
    await act(async () => {
      await expect(result.current.register({ username: 'carol', password: 'pw' })).resolves.toBe(true);
    });
    expect(result.current).toMatchObject({ isLoggedIn: true, username: 'carol' });
    await act(async () => {
      await expect(result.current.changePassword({ username: 'carol', password: 'pw' }, 'new')).resolves.toBe(true);
    });
    expect(api.changePassword).toHaveBeenCalledWith('carol', 'pw', 'new');
  });
});
