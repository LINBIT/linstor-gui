// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { capitalize } from '../stringUtils';

test('capitalize', () => {
  expect(capitalize('hello')).toBe('Hello');
  expect(capitalize('')).toBe('');
  expect(capitalize('1')).toBe('1');
  expect(capitalize('hello world')).toBe('Hello world');
});
