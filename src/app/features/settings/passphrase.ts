// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { patch, post, put } from '../requests';

const createPassphrase = (passphrase: string) => {
  return post('/v1/encryption/passphrase', {
    body: {
      new_passphrase: passphrase,
    },
  });
};

const editPassphrase = (passphrase: string, old_passphrase: string) => {
  return put('/v1/encryption/passphrase', {
    body: {
      new_passphrase: passphrase,
      old_passphrase: old_passphrase,
    },
  });
};

const enterPassPhrase = (passphrase: string) => {
  return patch('/v1/encryption/passphrase', {
    body: passphrase,
  });
};

export { enterPassPhrase, createPassphrase, editPassphrase };
