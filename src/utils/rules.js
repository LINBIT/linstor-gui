import BigNumber from 'bignumber.js'
import i18n from '@/lang'

function checkPort(rule, value, callback) {
  const val = new BigNumber(value)
  if ((!/^[0-9]{1,5}$/.test(value)) || val.isNaN() || !val.isFinite() || val.comparedTo(0) <= 0 || val.comparedTo(65534) > 0
  ) {
    callback(new Error(i18n.t('端口范围在1~65534')))
  } else {
    callback()
  }
}
function volumeSize(rule, value, callback) {
  const val = new BigNumber(value)
  if ((!/^[0-9]+$/.test(value)) || val.isNaN() || !val.isFinite() || val.comparedTo(4) < 0 || val.comparedTo(1099511627776) > 0
  ) {
    callback(new Error(i18n.t('volume_size_range')))
  } else {
    callback()
  }
}

function convertRoundUp(name, size) {
  const calc = {
    'B': 512,
    'K': 522,
    'kB': 2563,
    'KiB': 522,
    'M': 532,
    'MB': 2566,
    'MiB': 532,
    'G': 542,
    'GB': 2569,
    'GiB': 542,
    'T': 552,
    'TB': 2572,
    'TiB': 552,
    'P': 562,
    'PB': 2575,
    'PiB': 562
  }
  const unit_in = calc[name]
  const unit_out = calc.KiB
  let result
  const fac_in = ((unit_in & 0xffffff00) >> 8) ** (unit_in & 0xff)
  const div_out = ((unit_out & 0xffffff00) >> 8) ** (unit_out & 0xff)
  const byte_sz = size * fac_in
  if (byte_sz % div_out !== 0) {
    result = (byte_sz / div_out) + 1
  } else {
    result = byte_sz / div_out
  }
  return parseInt(result)
}

const sizeOptions = [{
  label: '',
  options: [{
    value: 'G',
    label: 'G'
  }, {
    value: 'GiB',
    label: 'GiB'
  }, {
    value: 'GB',
    label: 'GB'
  }]
}, {
  label: '',
  options: [{
    value: 'B',
    label: 'B'
  }, {
    value: 'K',
    label: 'K'
  }, {
    value: 'kB',
    label: 'kB'
  }, {
    value: 'KiB',
    label: 'KiB'
  }]
}, {
  label: '',
  options: [{
    value: 'M',
    label: 'M'
  }, {
    value: 'MiB',
    label: 'MiB'
  }, {
    value: 'MB',
    label: 'MB'
  }]
}, {
  label: '',
  options: [{
    value: 'T',
    label: 'T'
  }, {
    value: 'TiB',
    label: 'TiB'
  }, {
    value: 'TB',
    label: 'TB'
  }]
}, {
  label: '',
  options: [{
    value: 'P',
    label: 'P'
  }, {
    value: 'PiB',
    label: 'PiB'
  }, {
    value: 'PB',
    label: 'PB'
  }]
}]

export {
  convertRoundUp,
  volumeSize,
  checkPort,
  sizeOptions
}
