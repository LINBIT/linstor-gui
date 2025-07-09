// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

export type IPv4Address = string;

export function compareIPv4(a: IPv4Address, b: IPv4Address): number {
  const partsA: number[] = a.split('.').map(Number);
  const partsB: number[] = b.split('.').map(Number);

  if (
    partsA.length !== 4 ||
    partsB.length !== 4 ||
    partsA.some((n) => isNaN(n) || n < 0 || n > 255) ||
    partsB.some((n) => isNaN(n) || n < 0 || n > 255)
  ) {
    throw new Error('Invalid IPv4 address');
  }

  for (let i = 0; i < 4; i++) {
    if (partsA[i] < partsB[i]) {
      return -1;
    } else if (partsA[i] > partsB[i]) {
      return 1;
    }
  }

  return 0;
}
