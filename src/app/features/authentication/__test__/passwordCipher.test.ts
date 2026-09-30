// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect } from 'vitest';
import { decryptPassword, encryptPassword } from '../passwordCipher';

const KEY = '1234123412ABCDEF';

// Written by CryptoJS.AES.encrypt(plain, KEY).toString(), which stored every
// password so far.
const CRYPTO_JS_RECORDS: [string, string][] = [
  ['admin', 'U2FsdGVkX18xWEjycuxxQjdh/qLNB2hC72k9J9ckSz4='],
  ['E2eAdmin-1', 'U2FsdGVkX1860v52WAdcv9OTMcAI5B2CbXpYEh8Nhtg='],
  [
    'pässwörd ✓ 密码 long enough to span several AES blocks',
    'U2FsdGVkX1/8PbipS4WNBRmW63knuJJVfyt35dI1kstrbOzHq6vUblbHPF39jpz6GIE9FD85gHnq5q4F8YHILGJB48ONNFFfVbbbWZhEcdE=',
  ],
];

describe('passwordCipher', () => {
  it.each(CRYPTO_JS_RECORDS)('reads the record CryptoJS wrote for %j', (plain, record) => {
    expect(decryptPassword(record, KEY)).toBe(plain);
  });

  it('writes records in the same format, salted afresh each time', () => {
    const first = encryptPassword('admin', KEY);
    const second = encryptPassword('admin', KEY);
    expect(first.startsWith('U2FsdGVkX1')).toBe(true);
    expect(first).not.toBe(second);
    expect(decryptPassword(first, KEY)).toBe('admin');
    expect(decryptPassword(second, KEY)).toBe('admin');
  });

  it('refuses a record that is not one, or not for this key', () => {
    expect(() => decryptPassword('not-a-ciphertext', KEY)).toThrow();
    expect(() => decryptPassword(btoa('Salted__'), KEY)).toThrow();
    expect(() => decryptPassword(CRYPTO_JS_RECORDS[0][1], 'another key')).toThrow();
  });
});
