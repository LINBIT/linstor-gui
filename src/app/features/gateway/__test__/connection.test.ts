// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, afterEach } from 'vitest';

import { currentGatewayHost, gatewayStatusUrl, isMixedContent } from '../connection';

describe('gateway connection', () => {
  afterEach(() => window.localStorage.removeItem('GATEWAY_HOST'));

  it('calls an http gateway from an https page mixed content', () => {
    expect(isMixedContent('http://10.0.0.1:8337/', 'https:')).toBe(true);
    expect(isMixedContent(' HTTP://10.0.0.1:8337/', 'https:')).toBe(true);
    expect(isMixedContent('https://10.0.0.1:8337/', 'https:')).toBe(false);
    expect(isMixedContent('http://10.0.0.1:8337/', 'http:')).toBe(false);
    expect(isMixedContent('', 'https:')).toBe(false);
  });

  it('builds the status URL with one slash whatever the host ends in', () => {
    expect(gatewayStatusUrl('https://10.0.0.1:8337/')).toBe('https://10.0.0.1:8337/api/v2/status');
    expect(gatewayStatusUrl('https://10.0.0.1:8337')).toBe('https://10.0.0.1:8337/api/v2/status');
  });

  it('reads the host the gateway requests go to', () => {
    expect(currentGatewayHost()).toBe('');
    window.localStorage.setItem('GATEWAY_HOST', 'https://10.0.0.1:8337/');
    expect(currentGatewayHost()).toBe('https://10.0.0.1:8337/');
  });
});
