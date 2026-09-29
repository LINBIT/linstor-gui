// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_ADMIN_USER_NAME } from '@app/const/settings';

import authAPI from './api';

export const USERS_QUERY_KEY = ['gui-users'];

// Keys of the user store that are not users.
const SYSTEM_FIELDS = ['__updated__', '__migrated_from__'];

export interface UserAuth {
  username: string;
  password: string;
}

export interface AuthContextValue {
  isLoggedIn: boolean;
  username: string | null;
  isAdmin: boolean;
  needsPasswordChange: boolean;

  login: (user: UserAuth) => Promise<boolean>;
  logout: () => void;
  checkLoginStatus: () => Promise<void>;
  register: (user: UserAuth) => Promise<boolean>;
  deleteUser: (username: string) => Promise<void>;
  resetPassword: (args: { user: string; newPassword: string }) => Promise<boolean>;
  changePassword: (args: { user: string; oldPassword: string; newPassword: string }) => Promise<boolean>;
  updatePassword: (args: { user: string; newPassword: string }) => Promise<boolean>;
  resetAuthenticationSystem: (preserveUsers?: boolean) => Promise<boolean>;
  setNeedsPasswordChange: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

/** The GUI user names, without the built-in admin and the store's bookkeeping keys. */
export const useUsers = (enabled = true) =>
  useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const users = await authAPI.getUsers();
      return users.filter((user) => user !== DEFAULT_ADMIN_USER_NAME && !SYSTEM_FIELDS.includes(user));
    },
    enabled,
  });
