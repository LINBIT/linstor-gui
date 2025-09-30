// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { USER_LOCAL_STORAGE_KEY, DEFAULT_ADMIN_USER_NAME, DEFAULT_ADMIN_USER_PASS } from '@app/const/settings';
import { KV_NAMESPACES } from '@app/const/kvstore';
import { KeyValueStoreType, kvStore } from '@app/features/keyValueStore';
import CryptoJS from 'crypto-js';

export interface UserAuth {
  username: string;
  password: string;
}

export class UserAuthAPI {
  private store: KeyValueStoreType;
  public usersInstance = KV_NAMESPACES.USERS;
  private key;

  constructor() {
    this.store = kvStore;
    // this.key = CryptoJS.enc.Utf8.parse('1234123412ABCDEF');
    this.key = '1234123412ABCDEF';
  }

  private async migrateUsersNamespace(): Promise<void> {
    try {
      // Only check for migration if new namespace doesn't exist
      const newNamespaceExists = await this.store.instanceExists(KV_NAMESPACES.USERS);

      // If new namespace already exists, no need to migrate
      if (newNamespaceExists) {
        return;
      }

      // Check if old namespace exists and needs migration
      const oldNamespaceExists = await this.store.instanceExists(KV_NAMESPACES.LEGACY_USERS);

      if (oldNamespaceExists) {
        // Get all data from old namespace
        const oldData = await this.store.get(KV_NAMESPACES.LEGACY_USERS);

        // Create new namespace with migrated data
        await this.store.create(KV_NAMESPACES.USERS, {
          override_props: {
            ...oldData.props,
            __updated__: new Date().toISOString(),
            __migrated_from__: KV_NAMESPACES.LEGACY_USERS,
          },
        });

        // Delete old namespace after successful migration
        await this.store.delete(KV_NAMESPACES.LEGACY_USERS);
        console.log(`Successfully migrated ${KV_NAMESPACES.LEGACY_USERS} namespace to ${KV_NAMESPACES.USERS}`);
      }
    } catch (error) {
      console.error('Failed to migrate users namespace:', error);
    }
  }

  public async register(user: UserAuth): Promise<boolean> {
    if (await this.store.getProperty(this.usersInstance, user.username)) {
      return false;
    }
    const encryptedPassword = await this.encrypt(user.password);
    await this.store.setProperty(this.usersInstance, user.username, encryptedPassword);
    return true;
  }

  public async login(user: UserAuth): Promise<boolean> {
    const encryptedPassword = await this.store.getProperty(this.usersInstance, user.username);
    if (!encryptedPassword) {
      return false;
    }
    try {
      const decryptedPassword = await this.decrypt(encryptedPassword);
      const success = decryptedPassword === user.password;
      if (success) {
        localStorage.setItem(USER_LOCAL_STORAGE_KEY, user.username);
      }
      return success;
    } catch (error) {
      // Handle decryption errors (e.g., corrupted or invalid encrypted data)
      console.error('Failed to decrypt password:', error);
      return false;
    }
  }

  // reset the password for a user
  public async resetPassword(username: string, newPassword: string): Promise<boolean> {
    const encryptedNewPassword = await this.encrypt(newPassword);
    await this.store.setProperty(this.usersInstance, username, encryptedNewPassword);
    return true;
  }

  public async changePassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
    // Verify the old password
    const encryptedOldPassword = await this.store.getProperty(this.usersInstance, username);
    if (!encryptedOldPassword) {
      return false;
    }
    const decryptedOldPassword = await this.decrypt(encryptedOldPassword);
    if (decryptedOldPassword !== oldPassword) {
      return false;
    }

    // Encrypt and store the new password
    const encryptedNewPassword = await this.encrypt(newPassword);
    await this.store.setProperty(this.usersInstance, username, encryptedNewPassword);
    return true;
  }

  public async userExists(username: string): Promise<boolean> {
    const password = await this.store.getProperty(this.usersInstance, username);
    return !!password;
  }

  public async deleteUser(username: string): Promise<void> {
    await this.store.deleteProperty(this.usersInstance, username);
  }

  // private async encrypt(password: string): Promise<string> {
  //   const passwordBuffer = new TextEncoder().encode(password);
  //   const key = await this.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  //   const iv = this.crypto.getRandomValues(new Uint8Array(12));
  //   const encryptedBuffer = await this.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, passwordBuffer);
  //   const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  //   encryptedArray.set(iv);
  //   encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);
  //   const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
  //   return encryptedBase64;
  // }

  // private async decrypt(encryptedPassword: string): Promise<string> {
  //   const encryptedArray = Uint8Array.from(atob(encryptedPassword), (c) => c.charCodeAt(0));
  //   const iv = encryptedArray.slice(0, 12);
  //   const encryptedBuffer = encryptedArray.slice(12).buffer;
  //   const key = await this.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  //   const decryptedBuffer = await this.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encryptedBuffer);
  //   const decryptedPassword = new TextDecoder().decode(decryptedBuffer);
  //   return decryptedPassword;
  // }

  private async encrypt(password: string): Promise<string> {
    return CryptoJS.AES.encrypt(password, this.key).toString();

    // const srcs = CryptoJS.enc.Utf8.parse(password);
    // const encrypted = CryptoJS.AES.encrypt(srcs, this.key, {
    //   iv: this.iv,
    //   mode: CryptoJS.mode.CBC,
    //   padding: CryptoJS.pad.Pkcs7,
    // });
    // return encrypted.ciphertext.toString().toUpperCase();
  }

  private async decrypt(encryptedPassword: string): Promise<string> {
    return CryptoJS.AES.decrypt(encryptedPassword, this.key).toString(CryptoJS.enc.Utf8);

    // const encryptedHexStr = CryptoJS.enc.Hex.parse(encryptedPassword);
    // const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    // const decrypt = CryptoJS.AES.decrypt(srcs, this.key, {
    //   iv: this.iv,
    //   mode: CryptoJS.mode.CBC,
    //   padding: CryptoJS.pad.Pkcs7,
    // });
    // const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    // return decryptedStr.toString();
  }

  // list all users in the store
  public async getUsers(): Promise<string[]> {
    const users = await this.store.listKeys(this.usersInstance);
    return users;
  }

  public logout() {
    localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
  }

  public getCurrentUser(): string | null {
    return localStorage.getItem(USER_LOCAL_STORAGE_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  public async initUserStore() {
    try {
      // Try to migrate from legacy namespace if needed
      await this.migrateUsersNamespace();

      // Check if user store already exists
      const exists = await this.store.instanceExists(this.usersInstance);

      if (!exists) {
        // Only create if it doesn't exist
        await this.store.create(this.usersInstance, {
          override_props: {
            __updated__: new Date().toISOString(),
          },
        });

        // Register default admin user only when creating new store
        await this.register({ username: DEFAULT_ADMIN_USER_NAME, password: DEFAULT_ADMIN_USER_PASS });
      }
    } catch (error) {
      console.error('Failed to initialize user store:', error);
    }
  }

  public async resetAuthenticationSystem(preserveUsers: boolean = true): Promise<boolean> {
    try {
      if (!preserveUsers) {
        await this.store.delete(this.usersInstance);
        await this.initUserStore();
      } else {
        const existingUsers = await this.getUsers();
        const nonAdminUsers: Record<string, string> = {};

        for (const username of existingUsers) {
          if (username !== DEFAULT_ADMIN_USER_NAME) {
            const password = await this.store.getProperty(this.usersInstance, username);
            if (password) {
              nonAdminUsers[username] = password;
            }
          }
        }

        // Reset admin password to default
        const encryptedPassword = await this.encrypt(DEFAULT_ADMIN_USER_PASS);
        await this.store.setProperty(this.usersInstance, DEFAULT_ADMIN_USER_NAME, encryptedPassword);

        for (const [username, password] of Object.entries(nonAdminUsers)) {
          await this.store.setProperty(this.usersInstance, username, password);
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to reset authentication system:', error);
      return false;
    }
  }
}

export default new UserAuthAPI();
