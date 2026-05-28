// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import { normalizeStoragePoolSpace } from '../storagePoolSpace';

const GiB = 1024 ** 3;
const PiB = 1024 ** 5;

describe('normalizeStoragePoolSpace', () => {
  it('computes used as total - free for a normal pool', () => {
    expect(normalizeStoragePoolSpace(100 * GiB, 40 * GiB)).toEqual({
      total: 100 * GiB,
      free: 40 * GiB,
      used: 60 * GiB,
    });
  });

  it('clamps a thin-pool sentinel free (free > total) to total, so used is 0', () => {
    // STORAGE_SPACES_THIN: 4096 PiB free on a 7.48 GiB pool.
    const total = Math.round(7.48 * GiB);
    const res = normalizeStoragePoolSpace(total, 4096 * PiB);
    expect(res.total).toBe(total);
    expect(res.free).toBe(total);
    expect(res.used).toBe(0);
  });

  it('treats a zero-total pool as empty', () => {
    expect(normalizeStoragePoolSpace(0, 4096 * PiB)).toEqual({ total: 0, free: 0, used: 0 });
  });

  it('treats undefined / null capacities as zero', () => {
    expect(normalizeStoragePoolSpace(undefined, undefined)).toEqual({ total: 0, free: 0, used: 0 });
    expect(normalizeStoragePoolSpace(null, null)).toEqual({ total: 0, free: 0, used: 0 });
  });

  it('floors negative inputs at zero', () => {
    expect(normalizeStoragePoolSpace(-5, -10)).toEqual({ total: 0, free: 0, used: 0 });
    expect(normalizeStoragePoolSpace(100, -10)).toEqual({ total: 100, free: 0, used: 100 });
  });

  it('handles a fully free pool', () => {
    expect(normalizeStoragePoolSpace(100, 100)).toEqual({ total: 100, free: 100, used: 0 });
  });
});
