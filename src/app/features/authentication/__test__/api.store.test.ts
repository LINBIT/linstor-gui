// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';
import CryptoJS from 'crypto-js';

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

import { kvStore } from '@app/features/keyValueStore';
import { KV_NAMESPACES } from '@app/const/kvstore';
import { DEFAULT_ADMIN_USER_NAME, DEFAULT_ADMIN_USER_PASS } from '@app/const/settings';
import { UserAuthAPI } from '../api';

// api.test.ts covers register/login/change/delete. This file covers the
// store lifecycle: legacy migration, first-run initialisation, the admin
// safety net, reset, and what a corrupt password record does to login.

const KEY = '1234123412ABCDEF';
const encrypt = (plain: string) => CryptoJS.AES.encrypt(plain, KEY).toString();
const decrypt = (cipher: string) => CryptoJS.AES.decrypt(cipher, KEY).toString(CryptoJS.enc.Utf8);

const store = vi.mocked(kvStore);

describe('UserAuthAPI store lifecycle', () => {
  let api: UserAuthAPI;

  beforeEach(() => {
    // Reset, not clear: a getProperty implementation left by one case would
    // otherwise make register() believe the user already exists in the next.
    vi.resetAllMocks();
    localStorage.clear();
    api = new UserAuthAPI();
    store.setProperty.mockResolvedValue(undefined as never);
    store.create.mockResolvedValue(undefined as never);
    store.delete.mockResolvedValue(undefined as never);
  });

  describe('initUserStore', () => {
    it('creates the store and registers the default admin on first run', async () => {
      store.instanceExists.mockResolvedValue(false as never);
      store.getProperty.mockResolvedValue(undefined as never);
      await api.initUserStore();

      expect(store.create).toHaveBeenCalledWith(KV_NAMESPACES.USERS, {
        override_props: { __updated__: expect.any(String) },
      });
      const [, user, cipher] = store.setProperty.mock.calls[0];
      expect(user).toBe(DEFAULT_ADMIN_USER_NAME);
      expect(decrypt(cipher as string)).toBe(DEFAULT_ADMIN_USER_PASS);
    });

    it('migrates the legacy "users" namespace once, then deletes it', async () => {
      // No new namespace yet, legacy present.
      store.instanceExists.mockImplementation(async (ns: string) => ns === KV_NAMESPACES.LEGACY_USERS);
      store.get.mockResolvedValue({ props: { alice: encrypt('pw') } } as never);
      store.getProperty.mockResolvedValue(encrypt('x') as never);

      await api.initUserStore();

      expect(store.get).toHaveBeenCalledWith(KV_NAMESPACES.LEGACY_USERS);
      expect(store.create).toHaveBeenCalledWith(KV_NAMESPACES.USERS, {
        override_props: expect.objectContaining({
          alice: expect.any(String),
          __migrated_from__: KV_NAMESPACES.LEGACY_USERS,
        }),
      });
      expect(store.delete).toHaveBeenCalledWith(KV_NAMESPACES.LEGACY_USERS);
    });

    it('re-creates a missing admin in an existing store, and leaves a present one alone', async () => {
      store.instanceExists.mockResolvedValue(true as never);
      store.getProperty.mockResolvedValueOnce(undefined as never);
      await api.initUserStore();
      expect(store.create).not.toHaveBeenCalled();
      expect(store.setProperty).toHaveBeenCalledWith(KV_NAMESPACES.USERS, DEFAULT_ADMIN_USER_NAME, expect.any(String));

      vi.resetAllMocks();
      store.setProperty.mockResolvedValue(undefined as never);
      store.instanceExists.mockResolvedValue(true as never);
      store.getProperty.mockResolvedValue(encrypt('custom') as never);
      await api.initUserStore();
      expect(store.setProperty).not.toHaveBeenCalled();
    });

    it('continues after a failed migration but rethrows a failed initialisation', async () => {
      store.instanceExists.mockRejectedValueOnce(new Error('kv down'));
      store.instanceExists.mockResolvedValue(true as never);
      store.getProperty.mockResolvedValue(encrypt('x') as never);
      await expect(api.initUserStore()).resolves.toBeUndefined();

      store.instanceExists.mockRejectedValue(new Error('kv down for good'));
      await expect(api.initUserStore()).rejects.toThrow('kv down for good');
    });
  });

  it('hasAdminUser is false on a store error, not an exception', async () => {
    store.getProperty.mockRejectedValue(new Error('boom'));
    await expect(api.hasAdminUser()).resolves.toBe(false);
  });

  it('updatePassword stores the new password without checking the old one', async () => {
    await expect(api.updatePassword('alice', 'new-pw')).resolves.toBe(true);
    const [, user, cipher] = store.setProperty.mock.calls[0];
    expect(user).toBe('alice');
    expect(decrypt(cipher as string)).toBe('new-pw');
    expect(store.getProperty).not.toHaveBeenCalled();

    store.setProperty.mockRejectedValue(new Error('read only'));
    await expect(api.updatePassword('alice', 'x')).resolves.toBe(false);
  });

  it('login fails cleanly on a password record that does not decrypt', async () => {
    store.getProperty.mockResolvedValue('not-a-ciphertext' as never);
    await expect(api.login({ username: 'alice', password: 'pw' })).resolves.toBe(false);
    expect(localStorage.getItem('linstorname')).toBeNull();
  });

  describe('resetAuthenticationSystem', () => {
    it('with preserveUsers resets only the admin password and keeps the others', async () => {
      const bobCipher = encrypt('bob-pw');
      store.listKeys.mockResolvedValue(['admin', 'bob'] as never);
      store.getProperty.mockImplementation(
        async (_ns: string, user: string) => (user === 'bob' ? bobCipher : encrypt('old-admin')) as never,
      );

      await expect(api.resetAuthenticationSystem(true)).resolves.toBe(true);

      const writes = Object.fromEntries(store.setProperty.mock.calls.map(([, u, c]) => [u, c as string]));
      expect(decrypt(writes.admin)).toBe(DEFAULT_ADMIN_USER_PASS);
      expect(writes.bob).toBe(bobCipher);
      expect(store.delete).not.toHaveBeenCalled();
    });

    it('without preserveUsers drops the store and initialises it again', async () => {
      store.instanceExists.mockResolvedValue(false as never);
      store.getProperty.mockResolvedValue(undefined as never);
      await expect(api.resetAuthenticationSystem(false)).resolves.toBe(true);
      expect(store.delete).toHaveBeenCalledWith(KV_NAMESPACES.USERS);
      expect(store.create).toHaveBeenCalledWith(KV_NAMESPACES.USERS, expect.anything());
    });

    it('reports failure instead of throwing', async () => {
      store.listKeys.mockRejectedValue(new Error('boom'));
      await expect(api.resetAuthenticationSystem(true)).resolves.toBe(false);
    });
  });
});
