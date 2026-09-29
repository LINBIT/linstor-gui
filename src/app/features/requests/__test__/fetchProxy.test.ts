// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Which replies the global fetch wrapper hands to the toast/log layer.

const toast = vi.hoisted(() => ({ handleAPICallRes: vi.fn(), toastsAreQuiet: vi.fn(() => false) }));
vi.mock('@app/utils/toast', () => toast);
const auth = vi.hoisted(() => ({ emitControllerAuthRequired: vi.fn() }));
vi.mock('@app/utils/controllerAuth', () => ({
  createControllerAuthRequiredError: () => new Error('auth'),
  emitControllerAuthRequired: auth.emitControllerAuthRequired,
  getControllerAuthToken: () => '',
  isControllerAuthRequired: () => false,
  isControllerRequestUrl: () => true,
  withControllerAuthHeaders: (headers: HeadersInit | undefined) => headers,
}));

const rawFetch = vi.fn();
const refused = [{ ret_code: -4611686018390163034, message: 'The path does not have a whitelisted parent' }];

const reply = (status: number, body: unknown, url = 'http://ctrl/v1/resource-definitions/r/files/f') => {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  const res = new Response(status === 204 ? null : text, { status });
  Object.defineProperty(res, 'url', { value: url });
  return res;
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('fetch proxy', () => {
  beforeAll(async () => {
    window.fetch = rawFetch as unknown as typeof window.fetch;
    await import('..');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([403, 409, 400, 500])('reports the ApiCallRc list of a %i reply', async (status) => {
    rawFetch.mockResolvedValue(reply(status, refused));
    await window.fetch('/v1/resource-definitions/r/files/f', { method: 'POST' });
    await settle();
    expect(toast.handleAPICallRes).toHaveBeenCalledWith(refused, expect.any(String), true);
  });

  it('leaves a 401 to the auth gate', async () => {
    rawFetch.mockResolvedValue(reply(401, refused));
    await window.fetch('/v1/nodes');
    await settle();
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();
    expect(auth.emitControllerAuthRequired).toHaveBeenCalled();
  });

  it('stays quiet about its own successful key-value-store writes, but not their failures', async () => {
    rawFetch.mockResolvedValue(reply(200, [{ ret_code: 1, message: 'ok' }], 'http://ctrl/v1/key-value-store/x'));
    await window.fetch('/v1/key-value-store/x', { method: 'PUT' });
    await settle();
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();

    rawFetch.mockResolvedValue(reply(500, refused, 'http://ctrl/v1/key-value-store/x'));
    await window.fetch('/v1/key-value-store/x', { method: 'PUT' });
    await settle();
    expect(toast.handleAPICallRes).toHaveBeenCalledTimes(1);
  });

  it('ignores a body that is not JSON', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    rawFetch.mockResolvedValue(reply(502, '<html>Bad Gateway</html>'));
    await window.fetch('/v1/nodes');
    await settle();
    process.off('unhandledRejection', unhandled);
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });
});
