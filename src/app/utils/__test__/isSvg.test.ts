// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';

import { isSvg } from '../isSvg';

describe('isSvg', () => {
  it('accepts SVG documents, with or without a prolog', () => {
    expect(isSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>')).toBe(true);
    expect(isSvg('  <svg></svg>\n')).toBe(true);
    expect(
      isSvg(
        '<?xml version="1.0"?>\n<!-- logo -->\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg/>',
      ),
    ).toBe(true);
  });

  it('rejects URLs, plain text and other markup', () => {
    expect(isSvg('https://cdn.example.com/logo.svg')).toBe(false);
    expect(isSvg('not svg')).toBe(false);
    expect(isSvg('')).toBe(false);
    expect(isSvg('<html><body><svg></svg></body></html>')).toBe(false);
  });

  it('rejects malformed SVG', () => {
    expect(isSvg('<svg><rect></svg>')).toBe(false);
    expect(isSvg('<svg>')).toBe(false);
  });
});
