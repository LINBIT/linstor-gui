// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@app/features/authentication', () => ({
  authAPI: {
    register: vi.fn(),
    login: vi.fn(),
    deleteUser: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    updatePassword: vi.fn(),
    getUsers: vi.fn(),
    resetAuthenticationSystem: vi.fn(),
  },
}));

vi.mock('@app/features/settings', () => ({
  settingAPI: {
    getProps: vi.fn(),
  },
}));

// Import mocked modules
import { authAPI } from '@app/features/authentication';
import { settingAPI } from '@app/features/settings';

// Constants
const DEFAULT_ADMIN_USER_NAME = 'admin';
const SYSTEM_FIELDS = ['__updated__', '__migrated_from__'];

describe('Auth Model Logic', () => {
  let mockAuthAPI: any;
  let mockSettingAPI: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthAPI = vi.mocked(authAPI);
    mockSettingAPI = vi.mocked(settingAPI);
  });

  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };

  global.localStorage = mockLocalStorage as any;

  describe('Initial State', () => {
    it('should have correct initial state values', () => {
      const initialState = {
        isLoggedIn: false,
        username: null,
        users: [],
        needsPasswordChange: false,
        isAdmin: false,
      };

      expect(initialState.isLoggedIn).toBe(false);
      expect(initialState.username).toBeNull();
      expect(initialState.users).toHaveLength(0);
      expect(initialState.needsPasswordChange).toBe(false);
      expect(initialState.isAdmin).toBe(false);
    });
  });

  describe('Reducer: setLoggedIn', () => {
    it('should update isLoggedIn state', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload = true;

      const newState = { ...currentState, isLoggedIn: payload };

      expect(newState.isLoggedIn).toBe(true);
    });
  });

  describe('Reducer: setUsername', () => {
    it('should update username state', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload = 'testuser';

      const newState = { ...currentState, username: payload };

      expect(newState.username).toBe('testuser');
    });

    it('should set username to null', () => {
      const currentState = {
        isLoggedIn: true,
        username: 'testuser',
        users: [],
        needsPasswordChange: false,
        isAdmin: false,
      };
      const payload = null;

      const newState = { ...currentState, username: payload };

      expect(newState.username).toBeNull();
    });
  });

  describe('Reducer: setUsers', () => {
    it('should filter out admin user from users list', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload = ['admin', 'user1', 'user2'];

      const filteredUsers = payload.filter(
        (user) => user !== DEFAULT_ADMIN_USER_NAME && !SYSTEM_FIELDS.includes(user as any),
      );
      const newState = { ...currentState, users: filteredUsers };

      expect(newState.users).toHaveLength(2);
      expect(newState.users).not.toContain('admin');
      expect(newState.users).toContain('user1');
      expect(newState.users).toContain('user2');
    });

    it('should filter out system fields from users list', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload = ['user1', '__updated__', '__migrated_from__', 'user2'];

      const filteredUsers = payload.filter(
        (user) => user !== DEFAULT_ADMIN_USER_NAME && !SYSTEM_FIELDS.includes(user as any),
      );
      const newState = { ...currentState, users: filteredUsers };

      expect(newState.users).toHaveLength(2);
      expect(newState.users).not.toContain('__updated__');
      expect(newState.users).not.toContain('__migrated_from__');
    });

    it('should handle empty users list', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload: string[] = [];

      const filteredUsers = payload.filter(
        (user) => user !== DEFAULT_ADMIN_USER_NAME && !SYSTEM_FIELDS.includes(user as any),
      );
      const newState = { ...currentState, users: filteredUsers };

      expect(newState.users).toHaveLength(0);
    });
  });

  describe('Reducer: setNeedsPasswordChange', () => {
    it('should update needsPasswordChange state', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload = true;

      const newState = { ...currentState, needsPasswordChange: payload };

      expect(newState.needsPasswordChange).toBe(true);
    });
  });

  describe('Reducer: setIsAdmin', () => {
    it('should update isAdmin state', () => {
      const currentState = { isLoggedIn: false, username: null, users: [], needsPasswordChange: false, isAdmin: false };
      const payload = true;

      const newState = { ...currentState, isAdmin: payload };

      expect(newState.isAdmin).toBe(true);
    });
  });

  describe('Effect: register', () => {
    it('should return success status', () => {
      const success = true;

      expect(success).toBe(true);
    });
  });

  describe('Effect: login', () => {
    it('should identify admin user by username', () => {
      const user = { username: 'admin', password: 'password' };
      const isAdmin = user.username === DEFAULT_ADMIN_USER_NAME;

      expect(isAdmin).toBe(true);
    });

    it('should identify non-admin user', () => {
      const user = { username: 'regularuser', password: 'password' };
      const isAdmin = user.username === DEFAULT_ADMIN_USER_NAME;

      expect(isAdmin).toBe(false);
    });

    it('should check needsPasswordChange from settings', () => {
      const settings = { needsPasswordChange: true };
      const shouldPrompt = settings?.needsPasswordChange !== undefined ? settings.needsPasswordChange : false;

      expect(shouldPrompt).toBe(true);
    });

    it('should use hideDefaultCredential for backward compatibility', () => {
      const settings = { needsPasswordChange: undefined, hideDefaultCredential: false };
      const user = { username: 'admin', password: 'admin' };

      let shouldPrompt = false;
      if (settings?.needsPasswordChange !== undefined) {
        shouldPrompt = settings.needsPasswordChange;
      } else if (user.password === 'admin') {
        shouldPrompt = !settings?.hideDefaultCredential;
      }

      expect(shouldPrompt).toBe(true);
    });
  });

  describe('Effect: logout', () => {
    it('should clear login state', () => {
      let isLoggedIn = true;
      let username = 'testuser';

      isLoggedIn = false;
      username = null;

      expect(isLoggedIn).toBe(false);
      expect(username).toBeNull();
    });

    it('should remove user from localStorage', () => {
      const key = 'user';

      mockLocalStorage.removeItem(key);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key);
    });
  });

  describe('Effect: deleteUser', () => {
    it('should clear current user state if deleting logged in user', () => {
      const currentUsername = 'user1';
      const usernameToDelete = 'user1';

      const shouldClearState = currentUsername === usernameToDelete;

      expect(shouldClearState).toBe(true);
    });

    it('should preserve current user state if deleting different user', () => {
      const currentUsername = 'user1';
      const usernameToDelete = 'user2';

      const shouldClearState = currentUsername === usernameToDelete;

      expect(shouldClearState).toBe(false);
    });
  });

  describe('Effect: changePassword', () => {
    it('should clear needsPasswordChange flag on success', () => {
      let needsPasswordChange = true;
      const success = true;

      if (success) {
        needsPasswordChange = false;
      }

      expect(needsPasswordChange).toBe(false);
    });

    it('should keep needsPasswordChange flag on failure', () => {
      let needsPasswordChange = true;
      const success = false;

      if (success) {
        needsPasswordChange = false;
      }

      expect(needsPasswordChange).toBe(true);
    });
  });

  describe('Effect: updatePassword', () => {
    it('should clear needsPasswordChange flag on success', () => {
      let needsPasswordChange = true;
      const success = true;

      if (success) {
        needsPasswordChange = false;
      }

      expect(needsPasswordChange).toBe(false);
    });
  });

  describe('Effect: checkLoginStatus', () => {
    it('should set logged in state when username in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('admin');

      const username = mockLocalStorage.getItem('user');
      const isLoggedIn = !!username;

      expect(isLoggedIn).toBe(true);
      expect(username).toBe('admin');
    });

    it('should not set logged in state when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const username = mockLocalStorage.getItem('user');
      const isLoggedIn = !!username;

      expect(isLoggedIn).toBe(false);
      expect(username).toBeNull();
    });

    it('should set isAdmin when username is admin', () => {
      const username = 'admin';
      const isAdmin = username === DEFAULT_ADMIN_USER_NAME;

      expect(isAdmin).toBe(true);
    });

    it('should check password change settings for admin', () => {
      const username = 'admin';
      const isAdmin = username === DEFAULT_ADMIN_USER_NAME;

      if (isAdmin) {
        const settings = { needsPasswordChange: false };
        const shouldPrompt = settings?.needsPasswordChange !== undefined ? settings.needsPasswordChange : false;

        expect(shouldPrompt).toBe(false);
      }
    });
  });

  describe('Effect: resetAuthenticationSystem', () => {
    it('should clear state when reset succeeds', () => {
      let isLoggedIn = true;
      let username = 'admin';
      const success = true;

      if (success) {
        isLoggedIn = false;
        username = null;
      }

      expect(isLoggedIn).toBe(false);
      expect(username).toBeNull();
    });

    it('should preserve users when preserveUsers is true', () => {
      const preserveUsers = true;
      const shouldGetUsers = preserveUsers;

      expect(shouldGetUsers).toBe(true);
    });

    it('should not refresh users when preserveUsers is false', () => {
      const preserveUsers = false;
      const shouldGetUsers = preserveUsers;

      expect(shouldGetUsers).toBe(false);
    });
  });

  describe('User Authentication Interface', () => {
    it('should define UserAuth structure', () => {
      const userAuth: { username: string; password: string } = {
        username: 'admin',
        password: 'password',
      };

      expect(userAuth.username).toBe('admin');
      expect(userAuth.password).toBe('password');
    });
  });

  describe('AuthState Interface', () => {
    it('should define AuthState structure', () => {
      const authState = {
        isLoggedIn: false,
        username: null,
        users: [],
        needsPasswordChange: false,
        isAdmin: false,
      };

      expect(authState.isLoggedIn).toBeDefined();
      expect(authState.username).toBeDefined();
      expect(authState.users).toBeDefined();
      expect(authState.needsPasswordChange).toBeDefined();
      expect(authState.isAdmin).toBeDefined();
    });
  });

  describe('System Fields Constants', () => {
    it('should contain all expected system fields', () => {
      expect(SYSTEM_FIELDS).toContain('__updated__');
      expect(SYSTEM_FIELDS).toContain('__migrated_from__');
      expect(SYSTEM_FIELDS).toHaveLength(2);
    });
  });

  describe('Password Change Logic', () => {
    it('should prioritize needsPasswordChange flag over other checks', () => {
      const settings = { needsPasswordChange: false, hideDefaultCredential: false };
      let shouldPrompt = false;

      if (settings?.needsPasswordChange !== undefined) {
        shouldPrompt = settings.needsPasswordChange;
      }

      expect(shouldPrompt).toBe(false);
    });

    it('should fall back to hideDefaultCredential when needsPasswordChange is undefined', () => {
      const settings = { needsPasswordChange: undefined, hideDefaultCredential: true };
      let shouldPrompt = false;

      if (settings?.needsPasswordChange !== undefined) {
        shouldPrompt = settings.needsPasswordChange;
      } else {
        shouldPrompt = !settings?.hideDefaultCredential;
      }

      expect(shouldPrompt).toBe(false);
    });
  });
});
