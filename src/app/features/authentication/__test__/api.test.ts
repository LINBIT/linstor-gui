// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UserAuthAPI } from '../api';
import { kvStore } from '@app/features/keyValueStore';
import { USER_LOCAL_STORAGE_KEY } from '@app/const/settings';
import { KV_NAMESPACES } from '@app/const/kvstore';
import CryptoJS from 'crypto-js';

// Mock the kvStore
vi.mock('@app/features/keyValueStore', () => ({
  kvStore: {
    getProperty: vi.fn(),
    setProperty: vi.fn(),
    deleteProperty: vi.fn(),
    listKeys: vi.fn(),
    create: vi.fn(),
    instanceExists: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('UserAuthAPI', () => {
  let userAuthAPI: UserAuthAPI;
  const mockKvStore = vi.mocked(kvStore);

  beforeEach(() => {
    userAuthAPI = new UserAuthAPI();
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(userAuthAPI.usersInstance).toBe(KV_NAMESPACES.USERS);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const user = { username: 'testuser', password: 'testpass' };
      mockKvStore.getProperty.mockResolvedValue(null);
      mockKvStore.setProperty.mockResolvedValue();

      const result = await userAuthAPI.register(user);

      expect(result).toBe(true);
      expect(mockKvStore.getProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, 'testuser');
      expect(mockKvStore.setProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, 'testuser', expect.any(String));
    });

    it('should fail to register an existing user', async () => {
      const user = { username: 'existinguser', password: 'testpass' };
      mockKvStore.getProperty.mockResolvedValue('encrypted_password');

      const result = await userAuthAPI.register(user);

      expect(result).toBe(false);
      expect(mockKvStore.setProperty).not.toHaveBeenCalled();
    });

    it('should encrypt the password before storing', async () => {
      const user = { username: 'testuser', password: 'testpass' };
      mockKvStore.getProperty.mockResolvedValue(null);
      mockKvStore.setProperty.mockResolvedValue();

      await userAuthAPI.register(user);

      const setPropertyCall = mockKvStore.setProperty.mock.calls[0];
      const encryptedPassword = setPropertyCall[2];

      expect(encryptedPassword).not.toBe('testpass');
      expect(typeof encryptedPassword).toBe('string');
    });
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      const user = { username: 'testuser', password: 'testpass' };
      const encryptedPassword = CryptoJS.AES.encrypt('testpass', '1234123412ABCDEF').toString();

      mockKvStore.getProperty.mockResolvedValue(encryptedPassword);

      const result = await userAuthAPI.login(user);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(USER_LOCAL_STORAGE_KEY, 'testuser');
    });

    it('should fail login with incorrect password', async () => {
      const user = { username: 'testuser', password: 'wrongpass' };
      const encryptedPassword = CryptoJS.AES.encrypt('correctpass', '1234123412ABCDEF').toString();

      mockKvStore.getProperty.mockResolvedValue(encryptedPassword);

      const result = await userAuthAPI.login(user);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should fail login for non-existent user', async () => {
      const user = { username: 'nonexistent', password: 'testpass' };
      mockKvStore.getProperty.mockResolvedValue(null);

      const result = await userAuthAPI.login(user);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      mockKvStore.setProperty.mockResolvedValue();

      const result = await userAuthAPI.resetPassword('testuser', 'newpass');

      expect(result).toBe(true);
      expect(mockKvStore.setProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, 'testuser', expect.any(String));
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with correct old password', async () => {
      const username = 'testuser';
      const oldPassword = 'oldpass';
      const newPassword = 'newpass';
      const encryptedOldPassword = CryptoJS.AES.encrypt(oldPassword, '1234123412ABCDEF').toString();

      mockKvStore.getProperty.mockResolvedValue(encryptedOldPassword);
      mockKvStore.setProperty.mockResolvedValue();

      const result = await userAuthAPI.changePassword(username, oldPassword, newPassword);

      expect(result).toBe(true);
      expect(mockKvStore.setProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, 'testuser', expect.any(String));
    });

    it('should fail to change password with incorrect old password', async () => {
      const username = 'testuser';
      const oldPassword = 'wrongpass';
      const newPassword = 'newpass';
      const encryptedOldPassword = CryptoJS.AES.encrypt('correctpass', '1234123412ABCDEF').toString();

      mockKvStore.getProperty.mockResolvedValue(encryptedOldPassword);

      const result = await userAuthAPI.changePassword(username, oldPassword, newPassword);

      expect(result).toBe(false);
      expect(mockKvStore.setProperty).toHaveBeenCalledTimes(0);
    });

    it('should fail to change password for non-existent user', async () => {
      const username = 'nonexistent';
      const oldPassword = 'oldpass';
      const newPassword = 'newpass';

      mockKvStore.getProperty.mockResolvedValue(null);

      const result = await userAuthAPI.changePassword(username, oldPassword, newPassword);

      expect(result).toBe(false);
    });
  });

  describe('userExists', () => {
    it('should return true for existing user', async () => {
      mockKvStore.getProperty.mockResolvedValue('encrypted_password');

      const result = await userAuthAPI.userExists('testuser');

      expect(result).toBe(true);
      expect(mockKvStore.getProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, 'testuser');
    });

    it('should return false for non-existent user', async () => {
      mockKvStore.getProperty.mockResolvedValue(null);

      const result = await userAuthAPI.userExists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should delete user from store', async () => {
      mockKvStore.deleteProperty.mockResolvedValue();

      await userAuthAPI.deleteUser('testuser');

      expect(mockKvStore.deleteProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, 'testuser');
    });
  });

  describe('getUsers', () => {
    it('should return list of users', async () => {
      const mockUsers = ['admin', 'user1', 'user2'];
      mockKvStore.listKeys.mockResolvedValue(mockUsers);

      const result = await userAuthAPI.getUsers();

      expect(result).toEqual(mockUsers);
      expect(mockKvStore.listKeys).toHaveBeenCalledWith(KV_NAMESPACES.USERS);
    });
  });

  describe('logout', () => {
    it('should remove user from localStorage', () => {
      localStorageMock.setItem(USER_LOCAL_STORAGE_KEY, 'testuser');

      userAuthAPI.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(USER_LOCAL_STORAGE_KEY);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from localStorage', () => {
      localStorageMock.setItem(USER_LOCAL_STORAGE_KEY, 'testuser');

      const result = userAuthAPI.getCurrentUser();

      expect(result).toBe('testuser');
      expect(localStorageMock.getItem).toHaveBeenCalledWith(USER_LOCAL_STORAGE_KEY);
    });

    it('should return null when no user is logged in', () => {
      const result = userAuthAPI.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when user is logged in', () => {
      localStorageMock.setItem(USER_LOCAL_STORAGE_KEY, 'testuser');

      const result = userAuthAPI.isLoggedIn();

      expect(result).toBe(true);
    });

    it('should return false when no user is logged in', () => {
      const result = userAuthAPI.isLoggedIn();

      expect(result).toBe(false);
    });
  });

  describe('initUserStore', () => {
    it('should create user store and register admin user', async () => {
      const mockCreate = mockKvStore.create.mockResolvedValue();
      const registerSpy = vi.spyOn(userAuthAPI, 'register').mockResolvedValue(true);

      await userAuthAPI.initUserStore();

      expect(mockCreate).toHaveBeenCalledWith(KV_NAMESPACES.USERS, {
        override_props: {
          __updated__: expect.any(String),
        },
      });
    });
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt passwords correctly', async () => {
      const password = 'testpassword123';
      const user = { username: 'testuser', password };

      // Register user (which encrypts password)
      mockKvStore.getProperty.mockResolvedValueOnce(null);
      mockKvStore.setProperty.mockResolvedValue();
      await userAuthAPI.register(user);

      // Get the encrypted password that was stored
      const setPropertyCall = mockKvStore.setProperty.mock.calls[0];
      const encryptedPassword = setPropertyCall[2];

      // Mock the encrypted password retrieval for login
      mockKvStore.getProperty.mockResolvedValue(encryptedPassword);

      // Login should work with the original password
      const loginResult = await userAuthAPI.login(user);
      expect(loginResult).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle kvStore errors gracefully in register', async () => {
      const user = { username: 'testuser', password: 'testpass' };
      mockKvStore.getProperty.mockRejectedValue(new Error('Storage error'));

      await expect(userAuthAPI.register(user)).rejects.toThrow('Storage error');
    });

    it('should handle kvStore errors gracefully in login', async () => {
      const user = { username: 'testuser', password: 'testpass' };
      mockKvStore.getProperty.mockRejectedValue(new Error('Storage error'));

      await expect(userAuthAPI.login(user)).rejects.toThrow('Storage error');
    });

    it('should handle decryption errors gracefully', async () => {
      const user = { username: 'testuser', password: 'testpass' };
      mockKvStore.getProperty.mockResolvedValue('invalid_encrypted_data');

      const result = await userAuthAPI.login(user);

      expect(result).toBe(false);
    });
  });
});
