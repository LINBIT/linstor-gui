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

function formatBytes(bytes: number) {
  const units = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  const size_kib = bytes;
  let index = 0;
  let counter = 1;
  let magnitude = 1 << 10;
  while (counter < units.length) {
    if (size_kib >= magnitude) {
      index = counter;
    } else {
      break;
    }
    magnitude = magnitude << 10;
    counter += 1;
  }
  magnitude = magnitude >> 10;
  let size_str;
  if (size_kib % magnitude !== 0) {
    const size_unit = new BigNumber(size_kib).dividedBy(magnitude).toFixed(2);
    size_str = size_unit + ' ' + units[index];
  } else {
    const size_unit = new BigNumber(size_kib).dividedBy(magnitude).toFixed(0);
    size_str = size_unit + ' ' + units[index];
  }

  return size_str;
  /*
    if (bytes < 1024) return bytes + ' KiB'
    else if (bytes < 1048576) return new BigNumber(bytes).dividedBy('1024').toFixed(2) + ' MiB'
    else return new BigNumber(bytes).dividedBy('1048576').toFixed(2) + ' GiB'*/
}

export { convertRoundUp, volumeSize, checkPort, sizeOptions, formatBytes };
