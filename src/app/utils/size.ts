// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import BigNumber from 'bignumber.js';

function checkPort(rule, value, callback) {
  const val = new BigNumber(value);
  if (
    !/^[0-9]{1,5}$/.test(value) ||
    val.isNaN() ||
    !val.isFinite() ||
    val.comparedTo(0) <= 0 ||
    val.comparedTo(65534) > 0
  ) {
    callback(new Error('Port range is 1~65534'));
  } else {
    callback();
  }
}

function volumeSize(rule, value, callback): void {
  const val = new BigNumber(value);
  if (
    !/^[0-9]+$/.test(value) ||
    val.isNaN() ||
    !val.isFinite() ||
    val.comparedTo(4) < 0 ||
    val.comparedTo(1099511627776) > 0
  ) {
    callback(new Error('Volume Size Range Error'));
  } else {
    callback();
  }
}

/**
 * Change size into KiB number
 * @param name
 * @param size
 */
function convertRoundUp(name: string, size: number): number {
  const calc = {
    B: 512,
    K: 522,
    kB: 2563,
    KiB: 522,
    M: 532,
    MB: 2566,
    MiB: 532,
    G: 542,
    GB: 2569,
    GiB: 542,
    T: 552,
    TB: 2572,
    TiB: 552,
    P: 562,
    PB: 2575,
    PiB: 562,
  };
  const unit_in = calc[name];
  const unit_out = calc.KiB;
  let result;
  const fac_in = ((unit_in & 0xffffff00) >> 8) ** (unit_in & 0xff);
  const div_out = ((unit_out & 0xffffff00) >> 8) ** (unit_out & 0xff);
  const byte_sz = size * fac_in;
  if (byte_sz % div_out !== 0) {
    result = byte_sz / div_out + 1;
  } else {
    result = byte_sz / div_out;
  }
  return parseInt(result);
}

const sizeOptions = [
  {
    value: 'KiB',
    label: 'KiB',
  },
  {
    value: 'MiB',
    label: 'MiB',
  },
  {
    value: 'GiB',
    label: 'GiB',
  },
  {
    value: 'TiB',
    label: 'TiB',
  },
];

function formatBytes(bytes: number): string {
  if (typeof bytes !== 'number') {
    return 'NaN';
  }

  const units = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  if (bytes === 0) return '0 Bytes';

  if (bytes < 1) {
    const byteValue = bytes * 1024;
    return `${Math.round(byteValue)} Bytes`;
  }

  const k = 1024;
  const dm = 2;

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) {
    return `${bytes.toFixed(dm)} KiB`;
  }

  if (i >= units.length - 1) {
    return (bytes / Math.pow(k, units.length - 2)).toFixed(dm) + ' ' + units[units.length - 1];
  }

  return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + units[i + 1];
}

function kibToGib(kib: number) {
  const gib = kib / (1024 * 1024);
  return Number(gib.toFixed(2));
}

export { convertRoundUp, volumeSize, checkPort, sizeOptions, formatBytes, kibToGib };
