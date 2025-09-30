// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { createModel } from '@rematch/core';
import { RootModel } from '.';
import { authAPI } from '@app/features/authentication';
import { USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME, DEFAULT_ADMIN_USER_PASS } from '@app/const/settings';
import { settingAPI } from '@app/features/settings';

// System fields that should be filtered from user list
const SYSTEM_FIELDS = ['__updated__', '__migrated_from__'] as const;

interface UserAuth {
  username: string;
  password: string;
}

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  users: string[];
  needsPasswordChange?: boolean;
  isAdmin?: boolean;
}

export const auth = createModel<RootModel>()({
  state: {
    isLoggedIn: false,
    username: null,
    users: [],
    needsPasswordChange: false,
    isAdmin: false,
  } as AuthState,
  reducers: {
    setLoggedIn(state, payload: boolean) {
      return { ...state, isLoggedIn: payload };
    },
    setUsername(state, payload: string | null) {
      return { ...state, username: payload };
    },
    setUsers(state, payload: string[]) {
      // Filter out admin user and system fields
      return {
        ...state,
        users: payload.filter((user) => user !== DEFAULT_ADMIN_USER_NAME && !SYSTEM_FIELDS.includes(user as any)),
      };
    },
    setNeedsPasswordChange(state, payload: boolean) {
      return { ...state, needsPasswordChange: payload };
    },
    setIsAdmin(state, payload: boolean) {
      return { ...state, isAdmin: payload };
    },
  },
  effects: (dispatch) => ({
    async register(user: UserAuth) {
      const success = await authAPI.register(user);
      if (success) {
        dispatch.auth.getUsers();
      }
      return success;
    },
    async login(user: UserAuth) {
      const success = await authAPI.login(user);
      if (success) {
        dispatch.auth.setLoggedIn(true);
        dispatch.auth.setUsername(user.username);
        if (user.username === DEFAULT_ADMIN_USER_NAME) {
          dispatch.auth.setIsAdmin(true);

          // Check needsPasswordChange from settings
          try {
            const settings = await settingAPI.getProps();

            // For backward compatibility: if needsPasswordChange is undefined,
            // check if user is using default password and hasn't hidden the credential tip
            let shouldPromptPasswordChange = false;

            if (settings?.needsPasswordChange !== undefined) {
              // New behavior: use the explicit needsPasswordChange flag
              shouldPromptPasswordChange = settings.needsPasswordChange;
            } else if (user.password === DEFAULT_ADMIN_USER_PASS) {
              // Backward compatibility: check hideDefaultCredential for old installations
              // If hideDefaultCredential is false or undefined, prompt for password change
              shouldPromptPasswordChange = !settings?.hideDefaultCredential;
            }

            if (shouldPromptPasswordChange) {
              dispatch.auth.setNeedsPasswordChange(true);
            }
          } catch (error) {
            console.error('Failed to get settings for password change check:', error);
          }
        }
        localStorage.setItem(USER_LOCAL_STORAGE_KEY, user.username);
      }
      return success;
    },
    logout() {
      dispatch.auth.setLoggedIn(false);
      dispatch.auth.setUsername(null);
      localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
    },
    async deleteUser(username: string, state) {
      await authAPI.deleteUser(username);
      const current = state.auth as AuthState; // Get the current state of the model
      if (current.username === username) {
        dispatch.auth.setLoggedIn(false);
        dispatch.auth.setUsername(null);
        localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
      }
      dispatch.auth.getUsers();
    },

    async resetPassword({ user, newPassword }) {
      const success = await authAPI.resetPassword(user, newPassword);
      return success;
    },
    async changePassword({ user, oldPassword, newPassword }) {
      const success = await authAPI.changePassword(user, oldPassword, newPassword);
      if (success) {
        dispatch.auth.setNeedsPasswordChange(false);
      }
      return success;
    },

    async checkLoginStatus() {
      const username = localStorage.getItem(USER_LOCAL_STORAGE_KEY);
      if (username) {
        dispatch.auth.setLoggedIn(true);
        dispatch.auth.setUsername(username);

        // Set isAdmin if the user is admin
        if (username === DEFAULT_ADMIN_USER_NAME) {
          dispatch.auth.setIsAdmin(true);

          // Check if admin needs to change password
          try {
            const settings = await settingAPI.getProps();
            if (settings?.needsPasswordChange) {
              dispatch.auth.setNeedsPasswordChange(true);
            }
          } catch (error) {
            console.error('Failed to check needsPasswordChange on login status check:', error);
          }
        }
      }
    },

    async getUsers() {
      const users = await authAPI.getUsers();
      dispatch.auth.setUsers(users);
    },

    async resetAuthenticationSystem(preserveUsers: boolean = true) {
      const success = await authAPI.resetAuthenticationSystem(preserveUsers);
      if (success) {
        dispatch.auth.setLoggedIn(false);
        dispatch.auth.setUsername(null);
        localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
        if (preserveUsers) {
          dispatch.auth.getUsers();
        }
      }
      return success;
    },
  }),
});
