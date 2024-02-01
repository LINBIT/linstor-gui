import { KeyValueStoreType, kvStore } from '@app/features/keyValueStore';
import CryptoJS from 'crypto-js';

export interface UserAuth {
  username: string;
  password: string;
}

export class UserAuthAPI {
  private store: KeyValueStoreType;
  private usersInstance = 'users';
  private key;
  private iv;

  constructor() {
    this.store = kvStore;
    // this.key = CryptoJS.enc.Utf8.parse('1234123412ABCDEF');
    // this.iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');
    this.key = '1234123412ABCDEF';
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
    const decryptedPassword = await this.decrypt(encryptedPassword);
    const success = decryptedPassword === user.password;
    if (success) {
      localStorage.setItem('linstorname', user.username);
    }
    return success;
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
}

export default new UserAuthAPI();
