// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// True when the string is an SVG document: well-formed XML whose root element
// is <svg>. The browser's own XML parser does the work, which is why this
// replaced is-svg (it bundled a SAX parser that pulls in Node's `stream`).
export const isSvg = (input: string): boolean => {
  const text = input.trim();
  // Cheap reject for URLs and other plain strings before parsing.
  if (!text.includes('<svg')) return false;

  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  return doc.getElementsByTagName('parsererror').length === 0 && doc.documentElement.localName === 'svg';
};
