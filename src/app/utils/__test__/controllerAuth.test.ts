// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearControllerAuthToken,
  getControllerAuthHeaderValue,
  getControllerAuthToken,
  isControllerRequestUrl,
  setControllerAuthToken,
} from '../controllerAuth';

describe('controllerAuth utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and clears the controller token in localStorage', () => {
    expect(getControllerAuthToken()).toBeNull();

    setControllerAuthToken('secret-token');

    expect(getControllerAuthToken()).toBe('secret-token');
    expect(getControllerAuthHeaderValue()).toBe('Bearer secret-token');

    clearControllerAuthToken();

    expect(getControllerAuthToken()).toBeNull();
    expect(getControllerAuthHeaderValue()).toBeUndefined();
  });

  it('detects controller API requests and excludes gateway/frontend paths', () => {
    expect(isControllerRequestUrl('/v1/controller/version')).toBe(true);
    expect(isControllerRequestUrl('http://localhost:3370/v1/nodes')).toBe(true);
    expect(isControllerRequestUrl('/api/v2/status')).toBe(false);
    expect(isControllerRequestUrl('/api/frontend/v1/mylinbit/status')).toBe(false);
  });
});
