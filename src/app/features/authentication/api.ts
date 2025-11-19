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
    // Only check for migration if new namespace doesn't exist
    const newNamespaceExists = await this.store.instanceExists(KV_NAMESPACES.USERS);

    // If new namespace already exists, no need to migrate
    if (newNamespaceExists) {
      console.log(`New namespace ${KV_NAMESPACES.USERS} already exists, skipping migration`);
      return;
    }

    // Check if old namespace exists and needs migration
    const oldNamespaceExists = await this.store.instanceExists(KV_NAMESPACES.LEGACY_USERS);

    if (oldNamespaceExists) {
      console.log(`Migrating from ${KV_NAMESPACES.LEGACY_USERS} to ${KV_NAMESPACES.USERS}...`);

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
    } else {
      console.log(`No legacy namespace ${KV_NAMESPACES.LEGACY_USERS} found, skipping migration`);
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
      // Handle decryption errors (e.g., malformed data)
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
    try {
      // Verify the old password
      const encryptedOldPassword = await this.store.getProperty(this.usersInstance, username);
      if (!encryptedOldPassword) {
        console.error('Change password failed: User not found:', username);
        return false;
      }

      console.log('Encrypted password from store:', encryptedOldPassword);
      const decryptedOldPassword = await this.decrypt(encryptedOldPassword);
      console.log('Decrypted old password:', decryptedOldPassword);
      console.log('Provided old password:', oldPassword);

      if (decryptedOldPassword !== oldPassword) {
        console.error('Change password failed: Old password mismatch');
        console.error('Expected:', decryptedOldPassword);
        console.error('Provided:', oldPassword);
        // For debugging only - remove in production
        if (username === 'admin') {
          console.warn('HINT: Your current admin password might be different than expected. Check the console logs.');
        }
        return false;
      }

      // Encrypt and store the new password
      const encryptedNewPassword = await this.encrypt(newPassword);
      console.log('New password encrypted successfully');
      await this.store.setProperty(this.usersInstance, username, encryptedNewPassword);
      console.log('Password changed successfully for user:', username);
      return true;
    } catch (error) {
      console.error('Error during password change:', error);
      return false;
    }
  }

  // Update password without verification (for logged-in users changing their own password)
  public async updatePassword(username: string, newPassword: string): Promise<boolean> {
    try {
      console.log('Updating password for user:', username);

      // Encrypt and store the new password directly
      const encryptedNewPassword = await this.encrypt(newPassword);
      console.log('New password encrypted successfully');
      await this.store.setProperty(this.usersInstance, username, encryptedNewPassword);
      console.log('Password updated successfully for user:', username);
      return true;
    } catch (error) {
      console.error('Error during password update:', error);
      return false;
    }
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
    try {
      console.log('Attempting to decrypt:', encryptedPassword);
      console.log('Using key:', this.key);

      const decrypted = CryptoJS.AES.decrypt(encryptedPassword, this.key);
      const result = decrypted.toString(CryptoJS.enc.Utf8);

      console.log('Decryption result:', result);
      console.log('Decryption result length:', result.length);

      // Check if decryption resulted in empty string (possible wrong key or format)
      if (!result) {
        console.warn('Decryption resulted in empty string - possible key or format mismatch');

        // Try alternative decryption methods for backward compatibility
        try {
          console.log('Trying alternative decryption method...');

          // Try treating the input as different format
          const alternativeDecrypted = CryptoJS.AES.decrypt(encryptedPassword, this.key).toString(CryptoJS.enc.Utf8);
          console.log('Alternative decryption result:', alternativeDecrypted);

          if (alternativeDecrypted) {
            return alternativeDecrypted;
          }
        } catch (altError) {
          console.error('Alternative decryption also failed:', altError);
        }
      }

      return result;

      // const encryptedHexStr = CryptoJS.enc.Hex.parse(encryptedPassword);
      // const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
      // const decrypt = CryptoJS.AES.decrypt(srcs, this.key, {
      //   iv: this.iv,
      //   mode: CryptoJS.mode.CBC,
      //   padding: CryptoJS.pad.Pkcs7,
      // });
      // const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
      // return decryptedStr.toString();
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
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
    } catch (error) {
      console.error('Migration failed, will attempt to initialize normally:', error);
      // Continue with initialization even if migration fails
    }

    try {
      // Check if user store already exists
      const exists = await this.store.instanceExists(this.usersInstance);

      if (!exists) {
        console.log(`Creating new user store: ${this.usersInstance}`);
        // Only create if it doesn't exist
        await this.store.create(this.usersInstance, {
          override_props: {
            __updated__: new Date().toISOString(),
          },
        });

        // Register default admin user only when creating new store
        await this.register({ username: DEFAULT_ADMIN_USER_NAME, password: DEFAULT_ADMIN_USER_PASS });
        console.log('Default admin user registered successfully');
      } else {
        console.log(`User store ${this.usersInstance} already exists`);
      }
    } catch (error) {
      console.error('Failed to initialize user store:', error);
      throw error; // Re-throw to let caller handle the error
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
