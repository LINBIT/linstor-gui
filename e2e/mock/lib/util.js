// SPDX-License-Identifier: GPL-3.0
//
// Small helpers shared by every scenario.

export const pad = (n, width) => String(n).padStart(width, '0');

export const fakeUuid = (seed) => {
  const hex = (seed >>> 0).toString(16).padStart(8, '0');
  return `${hex}-0000-0000-0000-${hex}${hex}`;
};
