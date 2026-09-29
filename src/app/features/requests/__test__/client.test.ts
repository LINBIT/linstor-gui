// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// What the controller client does around each request: auth, the auth gate,
// and handing replies to the toast/log layer. window.fetch is not patched.

// Node's Request, unlike a browser's, cannot resolve a relative URL.
vi.hoisted(() => window.localStorage.setItem('LINSTOR_HOST', 'http://controller.test'));

const toast = vi.hoisted(() => ({ handleAPICallRes: vi.fn(), toastsAreQuiet: vi.fn(() => false) }));
vi.mock('@app/utils/toast', () => toast);
const auth = vi.hoisted(() => ({
  emitControllerAuthRequired: vi.fn(),
  required: false,
  token: '',
}));
vi.mock('@app/utils/controllerAuth', () => ({
  createControllerAuthRequiredError: () => Object.assign(new Error('auth'), { isControllerAuthRequired: true }),
  emitControllerAuthRequired: auth.emitControllerAuthRequired,
  getControllerAuthToken: () => auth.token,
  isControllerAuthRequired: () => auth.required,
  withControllerAuthHeaders: (init?: HeadersInit) => {
    const headers = new Headers(init);
    if (auth.token) headers.set('Authorization', `Bearer ${auth.token}`);
    return headers;
  },
}));

import { ApiError, get, post, unwrap } from '..';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const refused = [{ ret_code: -4611686018390163034, message: 'The path does not have a whitelisted parent' }];

const reply = (status: number, body: unknown, type = 'application/json') =>
  new Response(status === 204 ? null : typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': type },
  });

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const sentRequest = () => fetchMock.mock.calls[0][0] as Request;

describe('controller client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.required = false;
    auth.token = '';
  });

  it('leaves window.fetch alone', () => {
    expect(window.fetch).toBe(fetchMock);
  });

  it('sends the stored token', async () => {
    auth.token = 'secret';
    fetchMock.mockResolvedValue(reply(200, []));
    await get('/v1/nodes');
    expect(sentRequest().headers.get('Authorization')).toBe('Bearer secret');
  });

  it('holds a request back when the controller wants a token and there is none', async () => {
    auth.required = true;
    await expect(get('/v1/nodes')).rejects.toThrow('auth');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(auth.emitControllerAuthRequired).toHaveBeenCalled();
  });

  it.each([403, 409, 400, 500])('reports the ApiCallRc list of a %i reply', async (status) => {
    fetchMock.mockResolvedValue(reply(status, refused));
    await post('/v1/resource-definitions/{resource}/files/{extFileName}', {
      params: { path: { resource: 'r', extFileName: 'f' } },
    });
    await settle();
    expect(toast.handleAPICallRes).toHaveBeenCalledWith(refused, expect.any(String), true);
  });

  it('hands a 401 to the auth gate and reports nothing', async () => {
    fetchMock.mockResolvedValue(reply(401, refused));
    await get('/v1/nodes');
    await settle();
    expect(auth.emitControllerAuthRequired).toHaveBeenCalled();
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();
  });

  it('keeps successful key-value-store writes quiet, but not their failures', async () => {
    const kv = () => post('/v1/key-value-store/{instance}' as never, { params: { path: { instance: 'x' } } } as never);
    fetchMock.mockResolvedValue(reply(200, [{ ret_code: 1, message: 'ok' }]));
    await kv();
    await settle();
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue(reply(500, refused));
    await kv();
    await settle();
    expect(toast.handleAPICallRes).toHaveBeenCalledTimes(1);
  });

  it('never logs replies that carry tokens', async () => {
    fetchMock.mockResolvedValue(reply(201, [{ ret_code: 1, message: 'Init token abc', obj_refs: { token: 'abc' } }]));
    await post('/v1/controller/auth/initialize-token-auth', {
      body: { only_satellites: false, description: 'x', no_https: false },
    });
    await settle();
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();
  });

  it('ignores replies that are not JSON (downloads, error pages)', async () => {
    fetchMock.mockResolvedValue(reply(502, '<html>Bad Gateway</html>', 'text/html'));
    await get('/v1/nodes');
    fetchMock.mockResolvedValue(reply(200, 'tarball', 'application/gzip'));
    await get('/v1/sos-report/download', { parseAs: 'blob' });
    await settle();
    expect(toast.handleAPICallRes).not.toHaveBeenCalled();
  });

  it('unwrap returns the data, or throws the reply error for an HTTP error', async () => {
    fetchMock.mockResolvedValue(reply(200, [{ name: 'n1' }]));
    await expect(unwrap(get('/v1/nodes'))).resolves.toEqual([{ name: 'n1' }]);

    fetchMock.mockResolvedValue(reply(403, refused));
    const failure = await unwrap(get('/v1/nodes')).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ status: 403, message: 'The path does not have a whitelisted parent' });

    // An error with an empty body still fails.
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));
    await expect(unwrap(get('/v1/nodes'))).rejects.toMatchObject({ status: 500, message: 'HTTP 500' });
  });
});
