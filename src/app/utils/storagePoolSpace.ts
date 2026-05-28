// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export type NormalizedSpace = { total: number; free: number; used: number };

/**
 * Normalize a storage pool's reported capacity for display.
 *
 * LINSTOR (or the SDS layer beneath it) can report a sentinel free capacity far
 * larger than the backing total for thin pools — e.g. STORAGE_SPACES_THIN
 * reports 4096 PiB free on a 7.48 GiB pool. Plotting that as-is produces a
 * negative "used" (total - free) and a meaningless axis, so we clamp free into
 * [0, total] and derive used as the non-negative remainder.
 */
export const normalizeStoragePoolSpace = (
  totalCapacity?: number | null,
  freeCapacity?: number | null,
): NormalizedSpace => {
  const total = Math.max(0, totalCapacity ?? 0);
  const rawFree = Math.max(0, freeCapacity ?? 0);
  const free = Math.min(rawFree, total);
  const used = total - free;
  return { total, free, used };
};
