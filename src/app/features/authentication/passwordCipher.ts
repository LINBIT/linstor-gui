// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { cbc } from '@noble/ciphers/aes.js';
import { concatBytes, randomBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { md5 } from '@noble/hashes/legacy.js';

// Stored passwords are in the format CryptoJS.AES.encrypt(text, passphrase)
// wrote: base64("Salted__" | 8-byte salt | AES-256-CBC ciphertext, PKCS#7),
// with key and IV derived from passphrase and salt by OpenSSL's EVP_BytesToKey
// (MD5, one round). Pure JS on purpose: crypto.subtle only exists in a secure
// context, and the GUI is often served over plain HTTP.

const MAGIC = utf8ToBytes('Salted__');
const SALT_BYTES = 8;
const KEY_BYTES = 32;
const IV_BYTES = 16;

const deriveKeyAndIv = (passphrase: string, salt: Uint8Array) => {
  const secret = concatBytes(utf8ToBytes(passphrase), salt);
  let block = new Uint8Array(0);
  let derived = new Uint8Array(0);
  while (derived.length < KEY_BYTES + IV_BYTES) {
    block = md5(concatBytes(block, secret));
    derived = concatBytes(derived, block);
  }
  return { key: derived.slice(0, KEY_BYTES), iv: derived.slice(KEY_BYTES, KEY_BYTES + IV_BYTES) };
};

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

const fromBase64 = (text: string): Uint8Array => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

export const encryptPassword = (plain: string, passphrase: string): string => {
  const salt = randomBytes(SALT_BYTES);
  const { key, iv } = deriveKeyAndIv(passphrase, salt);
  return toBase64(concatBytes(MAGIC, salt, cbc(key, iv).encrypt(utf8ToBytes(plain))));
};

/** Throws on anything that is not such a record, or not for this passphrase. */
export const decryptPassword = (record: string, passphrase: string): string => {
  const bytes = fromBase64(record);
  const header = bytes.subarray(0, MAGIC.length);
  if (bytes.length <= MAGIC.length + SALT_BYTES || !header.every((b, i) => b === MAGIC[i])) {
    throw new Error('Not an encrypted password record');
  }
  const salt = bytes.subarray(MAGIC.length, MAGIC.length + SALT_BYTES);
  const { key, iv } = deriveKeyAndIv(passphrase, salt);
  const plain = cbc(key, iv).decrypt(bytes.subarray(MAGIC.length + SALT_BYTES));
  return new TextDecoder('utf-8', { fatal: true }).decode(plain);
};
