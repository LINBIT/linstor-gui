// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/**
 * KV Store namespace constants
 * These constants define the namespace names used in the key-value store
 */

export const KV_NAMESPACES = {
  USERS: '__gui__users',
  SETTINGS: '__gui__settings',
  // Legacy namespaces for migration
  LEGACY_USERS: 'users',
} as const;

export type KVNamespace = (typeof KV_NAMESPACES)[keyof typeof KV_NAMESPACES];
