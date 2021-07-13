// import parseTime, formatTime and set to filter
export { parseTime, formatTime } from '@/utils'
import BigNumber from 'bignumber.js'

/**
 * Show plural label if time is plural number
 * @param {number} time
 * @param {string} label
 * @return {string}
 */
function pluralize(time, label) {
  if (time === 1) {
    return time + label
  }
  return time + label + 's'
}

/**
 * @param {number} time
 */
export function timeAgo(time) {
  const between = Date.now() / 1000 - Number(time)
  if (between < 3600) {
    return pluralize(~~(between / 60), ' minute')
  } else if (between < 86400) {
    return pluralize(~~(between / 3600), ' hour')
  } else {
    return pluralize(~~(between / 86400), ' day')
  }
}

/**
 * Number formatting
 * like 10000 => 10k
 * @param {number} num
 * @param {number} digits
 */
export function numberFormatter(num, digits) {
  const si = [
    { value: 1E18, symbol: 'E' },
    { value: 1E15, symbol: 'P' },
    { value: 1E12, symbol: 'T' },
    { value: 1E9, symbol: 'G' },
    { value: 1E6, symbol: 'M' },
    { value: 1E3, symbol: 'k' }
  ]
  for (let i = 0; i < si.length; i++) {
    if (num >= si[i].value) {
      return (num / si[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') + si[i].symbol
    }
  }
  return num.toString()
}

/**
 * 10000 => "10,000"
 * @param {number} num
 */
export function toThousandFilter(num) {
  return (+num || 0).toString().replace(/^-?\d+/g, m => m.replace(/(?=(?!\b)(\d{3})+$)/g, ','))
}

/**
 * Upper case first char
 * @param {String} string
 */
export function uppercaseFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function formatBytes(bytes) {
  const units = [
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB'
  ]

  const size_kib = bytes
  let index = 0
  let counter = 1
  let magnitude = 1 << 10
  while (counter < units.length) {
    if (size_kib >= magnitude) {
      index = counter
    } else {
      break
    }
    magnitude = magnitude << 10
    counter += 1
  }
  magnitude = magnitude >> 10
  let size_str
  if (size_kib % magnitude !== 0) {
    const size_unit = new BigNumber(size_kib).dividedBy(magnitude).toFixed(2)
    size_str = size_unit + ' ' + units[index]
  } else {
    const size_unit = new BigNumber(size_kib).dividedBy(magnitude).toFixed(0)
    size_str = size_unit + ' ' + units[index]
  }

  return size_str
  /*
    if (bytes < 1024) return bytes + ' KiB'
    else if (bytes < 1048576) return new BigNumber(bytes).dividedBy('1024').toFixed(2) + ' MiB'
    else return new BigNumber(bytes).dividedBy('1048576').toFixed(2) + ' GiB'*/
}

export function replaceDrbd(val) {
  if (typeof val === 'string') {
    return val
  } else {
    return val
  }
}

export function replaceText(val = '') {
  return val
}
