// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { logger } from '@app/utils/logger';
import { USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME, DEFAULT_ADMIN_USER_PASS } from '@app/const/settings';
import { settingAPI } from '@app/features/settings';
import { useSettings } from '@app/features/settings/useSettings';

import authAPI from './api';
import { AuthContext, USERS_QUERY_KEY, type AuthContextValue, type UserAuth } from './useAuth';

/**
 * Whether the admin should be asked to change the password. New installs set
 * needsPasswordChange explicitly; older ones only know hideDefaultCredential,
 * which matters while the default password is still in use.
 */
const promptPasswordChange = async (password?: string): Promise<boolean> => {
  // Logged in with a real password: there is no default one left to change,
  // whatever a stale flag says.
  if (password !== undefined && password !== DEFAULT_ADMIN_USER_PASS) {
    return false;
  }
  try {
    const settings = await settingAPI.getProps();
    if (settings?.needsPasswordChange !== undefined) {
      return settings.needsPasswordChange;
    }
    return (password === undefined || password === DEFAULT_ADMIN_USER_PASS) && !settings?.hideDefaultCredential;
  } catch (error) {
    logger.error('Failed to get settings for password change check:', error);
    return false;
  }
};

/** The GUI's own user accounts (not LINSTOR's). Replaces the former rematch `auth` model. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { refreshAdmin } = useSettings();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  // Everything tied to the signed-in user goes, so the next user in the same
  // tab does not inherit the admin flag or the forced password change.
  const signOut = useCallback(() => {
    setUsername(null);
    setIsAdmin(false);
    setNeedsPasswordChange(false);
    localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
    refreshAdmin();
  }, [refreshAdmin]);

  const reloadUsers = useCallback(() => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }), [queryClient]);

  const signIn = useCallback(
    async (name: string, password?: string) => {
      const admin = name === DEFAULT_ADMIN_USER_NAME;
      setUsername(name);
      setIsAdmin(admin);
      setNeedsPasswordChange(admin && (await promptPasswordChange(password)));
      localStorage.setItem(USER_LOCAL_STORAGE_KEY, name);
      refreshAdmin();
    },
    [refreshAdmin],
  );

  const login = useCallback(
    async (user: UserAuth) => {
      const success = await authAPI.login(user);
      if (success) {
        await signIn(user.username, user.password);
      }
      return success;
    },
    [signIn],
  );

  const checkLoginStatus = useCallback(async () => {
    const stored = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
    if (stored) {
      await signIn(stored);
    }
  }, [signIn]);

  const register = useCallback(
    async (user: UserAuth) => {
      const success = await authAPI.register(user);
      if (success) {
        await reloadUsers();
      }
      return success;
    },
    [reloadUsers],
  );

  const deleteUser = useCallback(
    async (name: string) => {
      await authAPI.deleteUser(name);
      if (username === name) {
        signOut();
      }
      // Awaited so the caller's deleting state lasts until the list is reloaded.
      await reloadUsers();
    },
    [username, signOut, reloadUsers],
  );

  const changePassword = useCallback<AuthContextValue['changePassword']>(async ({ user, oldPassword, newPassword }) => {
    const success = await authAPI.changePassword(user, oldPassword, newPassword);
    if (success) setNeedsPasswordChange(false);
    return success;
  }, []);

  const updatePassword = useCallback<AuthContextValue['updatePassword']>(async ({ user, newPassword }) => {
    const success = await authAPI.updatePassword(user, newPassword);
    if (success) setNeedsPasswordChange(false);
    return success;
  }, []);

  const resetPassword = useCallback<AuthContextValue['resetPassword']>(
    ({ user, newPassword }) => authAPI.resetPassword(user, newPassword),
    [],
  );

  const resetAuthenticationSystem = useCallback(
    async (preserveUsers = true) => {
      const success = await authAPI.resetAuthenticationSystem(preserveUsers);
      if (success) {
        signOut();
        if (preserveUsers) await reloadUsers();
      }
      return success;
    },
    [signOut, reloadUsers],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn: username !== null,
      username,
      isAdmin,
      needsPasswordChange,
      login,
      logout: signOut,
      checkLoginStatus,
      register,
      deleteUser,
      resetPassword,
      changePassword,
      updatePassword,
      resetAuthenticationSystem,
      setNeedsPasswordChange,
    }),
    [
      username,
      isAdmin,
      needsPasswordChange,
      login,
      signOut,
      checkLoginStatus,
      register,
      deleteUser,
      resetPassword,
      changePassword,
      updatePassword,
      resetAuthenticationSystem,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
